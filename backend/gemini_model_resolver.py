"""
Gemini Smart Model Resolver — Auto-selects the best available model.

Queries the Gemini API's model list and dynamically selects the highest-quality
model that supports content generation. Defaults to Gemini 3.1 series.
Falls back gracefully if the API list call fails.

Usage:
    from gemini_model_resolver import get_best_model, print_available_models

    # Auto-select best model
    model = get_best_model()
    response = model.generate_content("Hello!")

    # Print all available models with rate limit info
    print_available_models()

    # Override via environment variable
    # Set GEMINI_MODEL=gemini-3.1-pro-preview to force a specific model

Get your free API key at: https://aistudio.google.com/app/apikey
View your rate limits at: https://aistudio.google.com/rate-limit

Official model docs: https://ai.google.dev/gemini-api/docs/models
"""

import os
import re
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

# ─── Verified Model IDs (March 2026) ────────────────────────────────────────
# Source: https://ai.google.dev/gemini-api/docs/models
#
# Gemini 3.1 series (current best):
#   gemini-3.1-pro-preview          — Best quality, 1M context, structured/thinking
#   gemini-3-flash-preview          — Frontier-class, fast, cost-efficient
#   gemini-3.1-flash-lite-preview   — Fastest, high-volume, lowest cost
#
# Gemini 2.5 series (stable fallback):
#   gemini-2.5-pro                  — Stable, proven quality
#   gemini-2.5-flash                — Stable, fast
#   gemini-2.5-flash-lite           — Stable, cheapest
# ─────────────────────────────────────────────────────────────────────────────

# Priority-ordered cascade — best model first
MODEL_CASCADE = [
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]

# Known free-tier rate limits (per project, March 2026)
# Source: https://ai.google.dev/gemini-api/docs/rate-limits
# Note: Actual limits viewable at https://aistudio.google.com/rate-limit
KNOWN_RATE_LIMITS = {
    # Key metric: RPD (Requests Per Day) — this is the binding constraint on free tier
    # RPD resets at midnight Pacific time
    "gemini-3.1-pro-preview":        {"RPD": 100,  "RPM": 5,  "TPM": 250_000, "tier": "pro",       "gen": "3.1"},
    "gemini-3-flash-preview":        {"RPD": 500,  "RPM": 10, "TPM": 250_000, "tier": "flash",     "gen": "3.0"},
    "gemini-3.1-flash-lite-preview": {"RPD": 1000, "RPM": 15, "TPM": 250_000, "tier": "flash-lite", "gen": "3.1"},
    "gemini-2.5-pro":                {"RPD": 100,  "RPM": 5,  "TPM": 250_000, "tier": "pro",       "gen": "2.5"},
    "gemini-2.5-flash":              {"RPD": 500,  "RPM": 10, "TPM": 250_000, "tier": "flash",     "gen": "2.5"},
    "gemini-2.5-flash-lite":         {"RPD": 1500, "RPM": 15, "TPM": 250_000, "tier": "flash-lite", "gen": "2.5"},
}

# Quality scoring: higher = better model
MODEL_TIER_SCORES = {
    "pro": 100,
    "flash": 50,
    "flash-lite": 25,
    "lite": 25,
}


def _score_model(model_name: str) -> float:
    """Score a model name by quality heuristic.
    
    Scoring: tier (pro > flash > lite) × version (3.1 > 3.0 > 2.5 > 2.0)
    Preview models get a small boost (they're newer).
    """
    name = model_name.lower().replace("models/", "")
    score = 0.0

    # Determine tier (check longer names first to avoid partial matches)
    if "flash-lite" in name:
        score = MODEL_TIER_SCORES["flash-lite"]
    elif "pro" in name:
        score = MODEL_TIER_SCORES["pro"]
    elif "lite" in name:
        score = MODEL_TIER_SCORES["lite"]
    elif "flash" in name:
        score = MODEL_TIER_SCORES["flash"]
    else:
        score = 10  # Unknown tier

    # Extract version number (e.g., "gemini-3.1-pro" → 3.1)
    version_match = re.search(r"(\d+)\.(\d+)", name)
    if version_match:
        major = int(version_match.group(1))
        minor = int(version_match.group(2))
        version_score = major + (minor * 0.1)
    elif re.search(r"gemini-(\d+)-", name):
        # Handle "gemini-3-flash-preview" format (no minor version)
        major = int(re.search(r"gemini-(\d+)-", name).group(1))
        version_score = float(major)
    elif "latest" in name:
        version_score = 2.5
    else:
        version_score = 1.0

    score *= version_score

    # Small boost for preview models (they're newer than stable)
    if "preview" in name:
        score *= 1.05

    # Penalize experimental models
    if "exp" in name:
        score *= 0.85

    return round(score, 2)


def discover_models() -> list:
    """Fetch all available Gemini models that support content generation.
    
    Returns a list of model names sorted by quality score (best first).
    """
    try:
        models = genai.list_models()
        content_models = []
        for m in models:
            # Filter for models that support generateContent
            methods = getattr(m, "supported_generation_methods", []) or []
            method_strs = [str(method) for method in methods]
            if any("generateContent" in s for s in method_strs):
                content_models.append(m.name)

        if not content_models:
            logger.warning("No content generation models found via API")
            return MODEL_CASCADE

        # Score and sort
        scored = [(name, _score_model(name)) for name in content_models]
        scored.sort(key=lambda x: x[1], reverse=True)

        # Clean names (remove "models/" prefix if present)
        result = [name.replace("models/", "") for name, _ in scored]

        logger.info(f"Discovered {len(result)} models. Top 5: {result[:5]}")
        return result

    except Exception as e:
        logger.warning(f"Failed to list models from API: {e}. Using fallback cascade.")
        return MODEL_CASCADE


def print_available_models(api_key: str = None):
    """Print a formatted table of all available models with rate limit info.
    
    Call this at startup to show users what models are available, their
    rate limits, and which one was auto-selected.
    """
    if api_key:
        genai.configure(api_key=api_key)

    available = discover_models()

    print("\n" + "=" * 80)
    print("  🤖 Available Gemini Models (Free Tier)")
    print("  Get your free API key: https://aistudio.google.com/app/apikey")
    print("  View live rate limits: https://aistudio.google.com/rate-limit")
    print("  RPD resets at midnight Pacific Time")
    print("=" * 80)
    print(f"  {'Model ID':<40} {'Tier':<12} {'RPD':<10} {'RPM':<6} {'Quality':<8}")
    print("-" * 80)

    for name in available[:15]:  # Show top 15
        clean_name = name.replace("models/", "")
        limits = KNOWN_RATE_LIMITS.get(clean_name, {})
        tier = limits.get("tier", "—")
        rpd = limits.get("RPD", "—")
        rpm = limits.get("RPM", "—")
        score = _score_model(clean_name)
        rpd_display = f"{rpd}/day" if rpd != "—" else "—"
        print(f"  {clean_name:<40} {tier:<12} {rpd_display:<10} {str(rpm):<6} {score:<8}")

    print("=" * 80)
    print(f"  Total models discovered: {len(available)}")
    print(f"  💡 Tip: Set GEMINI_MODEL env var to override auto-selection")
    print("=" * 80 + "\n")


def get_best_model(api_key: str = None, preferred_tier: str = None) -> genai.GenerativeModel:
    """Auto-select and return the best available Gemini model.
    
    Resolution order:
    1. GEMINI_MODEL env var override (if set)
    2. Dynamic discovery from API (genai.list_models())
    3. Static fallback cascade (MODEL_CASCADE)
    
    Args:
        api_key: Optional API key. If not provided, must be pre-configured.
        preferred_tier: Optional filter — "pro", "flash", or "lite".
    
    Returns:
        A configured genai.GenerativeModel using the best available model.
    """
    if api_key:
        genai.configure(api_key=api_key)

    # 1. Check for explicit env var override
    env_model = os.environ.get("GEMINI_MODEL")
    if env_model:
        try:
            model = genai.GenerativeModel(env_model)
            model.count_tokens("test")
            logger.info(f"✅ Using env override model: {env_model}")
            return model
        except Exception as e:
            logger.warning(f"⚠️  Env model {env_model} failed: {e}. Falling back to auto-select.")

    # 2. Dynamic discovery
    available = discover_models()

    # Filter by preferred tier if specified
    if preferred_tier:
        tier_filtered = [m for m in available if preferred_tier.lower() in m.lower()]
        if tier_filtered:
            available = tier_filtered

    # 3. Try each model until one works
    for model_name in available:
        try:
            model = genai.GenerativeModel(model_name)
            model.count_tokens("test")  # Quick validation
            logger.info(f"✅ Selected model: {model_name}")
            print(f"✅ Gemini model: {model_name}")
            return model
        except Exception as e:
            logger.debug(f"Model {model_name} failed: {e}")

    # 4. Absolute last resort
    fallback = MODEL_CASCADE[-1]
    logger.warning(f"All models failed validation. Using last resort: {fallback}")
    return genai.GenerativeModel(fallback)


def get_best_model_name(api_key: str = None, preferred_tier: str = None) -> str:
    """Same as get_best_model but returns just the model name string."""
    if api_key:
        genai.configure(api_key=api_key)

    env_model = os.environ.get("GEMINI_MODEL")
    if env_model:
        try:
            model = genai.GenerativeModel(env_model)
            model.count_tokens("test")
            return env_model
        except Exception:
            pass

    available = discover_models()
    if preferred_tier:
        tier_filtered = [m for m in available if preferred_tier.lower() in m.lower()]
        if tier_filtered:
            available = tier_filtered

    for model_name in available:
        try:
            model = genai.GenerativeModel(model_name)
            model.count_tokens("test")
            return model_name
        except Exception:
            continue

    return MODEL_CASCADE[-1]


def get_rate_limits(model_name: str = None) -> dict:
    """Get known rate limits for a model.
    
    Returns dict with RPM, TPM, RPD keys.
    For live limits, visit: https://aistudio.google.com/rate-limit
    """
    if model_name:
        clean = model_name.replace("models/", "")
        return KNOWN_RATE_LIMITS.get(clean, {"RPM": "unknown", "TPM": "unknown", "RPD": "unknown"})
    return KNOWN_RATE_LIMITS
