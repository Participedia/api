-- Parameters
-- query
-- language (defaults to 'en'
-- offset (defaults to 1)
-- limit (20 for now)
-- userid (may be null)
WITH all_selections AS (SELECT
  id,
  title,
  description,
  substring(body for 500) AS body
FROM search_index_${language:raw}
WHERE document @@ to_tsquery('english', ${query})
  ${filter:raw}
ORDER BY ts_rank(search_index_${language:raw}.document, to_tsquery('english', ${query})) DESC
),
total_selections AS (
  SELECT count(all_selections.id) AS total
  FROM all_selections
)

SELECT
  things.id,
  things.type,
  things.featured,
  all_selections.title,
  all_selections.description,
  all_selections.body,
  to_json(get_location(things.id)) AS location,
  to_json(COALESCE(things.images, '{}')) AS images,
  to_json(COALESCE(things.images, '{}')) AS photos,
  to_json(COALESCE(things.videos, '{}')) AS videos,
  things.updated_date,
  bookmarked(things.type, things.id, ${userId}),
  total_selections.total
FROM all_selections, total_selections, things
WHERE all_selections.id = things.id AND
  all_selections.id = things.id
OFFSET ${offset}
LIMIT ${limit}
;
