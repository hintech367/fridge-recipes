import React, { useState, useMemo } from "react";
import "./RecipesList.css";
import recipes from "../data/recipes.json";

function resolveImage(imageField) {
  if (!imageField) return null;
  if (/^https?:\/\//i.test(imageField) || imageField.startsWith("/")) return imageField;
  return `/assets/${imageField}`;
}

export default function RecipesList() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return recipes;
    return recipes.filter((r) =>
      (r.title || "")
        .toLowerCase()
        .includes(term) ||
      (r.title_he || "").toLowerCase().includes(term) ||
      (r.description || "").toLowerCase().includes(term) ||
      (r.tags || []).join(" ").toLowerCase().includes(term)
    );
  }, [q]);

  return (
    <section className="recipes-section">
      <header className="recipes-header">
        <h2>Recipes</h2>
        <div className="search-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, tag or description..."
            aria-label="Search recipes"
          />
          <div className="count">{filtered.length} results</div>
        </div>
      </header>

      <div className="recipes-grid">
        {filtered.map((r) => {
          const src = resolveImage(r.image);
          return (
            <article className="recipe-card" key={r.id}>
              <div className="recipe-image-wrap">
                {src ? (
                  <img
                    src={src}
                    alt={r.title || ""}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "";
                    }}
                    className="recipe-image"
                  />
                ) : (
                  <div className="recipe-no-image" />
                )}
              </div>

              <div className="recipe-body">
                <h3 className="recipe-title">
                  {r.title} {r.title_he ? <small>— {r.title_he}</small> : null}
                </h3>

                <p className="recipe-desc">{r.description}</p>

                <div className="recipe-meta">
                  <span>
                    ⏱{" "}
                    {r.total_time ??
                      (r.prep_time != null && r.cook_time != null
                        ? r.prep_time + r.cook_time
                        : "-")}{" "}
                    min
                  </span>
                  <span> • 🍽 {r.servings ?? "-"}</span>
                  <span> • {r.difficulty ?? "—"}</span>
                </div>

                <div className="recipe-tags">
                  {(r.tags || []).slice(0, 5).map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>

                <div className="recipe-actions">
                  <button onClick={() => alert(`${r.title}\n\n${r.description}`)}>View</button>
                  <button
                    className="secondary"
                    onClick={() => navigator.clipboard?.writeText(window.location.href + `#${r.id}`)}
                    title="Copy link"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}