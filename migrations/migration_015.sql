CREATE OR REPLACE FUNCTION get_case_localized_value(field text, key text, lookup json) RETURNS localized_value
  LANGUAGE sql STABLE
  AS $_$
  SELECT
    CASE
      WHEN key = 'yes' then (key, key, trim('"' from (lookup->key)::text))::localized_value
      WHEN key = 'no' then (key, key, trim('"' from (lookup->key)::text))::localized_value
      WHEN key = 'true' then (key, key, trim('"' from (lookup->key)::text))::localized_value
      WHEN key = 'false' then (key, key, trim('"' from (lookup->key)::text))::localized_value
      WHEN key = '' then ('', '', '')::localized_value
      ELSE (key, concat(field, '_value_', key), trim('"' from (lookup->concat(field, '_value_', key))::text))::localized_value
    END
    AS value
$_$;


CREATE OR REPLACE FUNCTION get_case_localized_list_or_null(field text, keys text[], lookup json) RETURNS localized_value[]
  LANGUAGE sql STABLE
  AS $_$
  SELECT array_agg(get_case_localized_value(field, key, lookup)) as values from (
    SELECT field, unnest(keys) as key
  ) as a group by field
$_$;

CREATE OR REPLACE FUNCTION get_case_localized_list(field text, keys text[], lookup json) RETURNS localized_value[]
  LANGUAGE sql STABLE
  AS $_$
  SELECT COALESCE(get_case_localized_list_or_null(field, keys, lookup), '{}');
$_$;


CREATE OR REPLACE FUNCTION local_tag(tag text, lookup json) RETURNS text
  LANGUAGE sql STABLE
  AS $_$
  SELECT trim('"' from (lookup->>tag)::text);
$_$;


CREATE OR REPLACE FUNCTION get_localized_tags_or_null(language text, tags text[]) RETURNS localized_value[]
  LANGUAGE sql STABLE
  AS $_$
WITH localized AS (
    SELECT to_json(tags_localized.*) as lookup FROM tags_localized WHERE language = language
  )
  SELECT array_agg((tag, tag, local_tag(tag, lookup))::localized_value) as values from (
    SELECT
       unnest(tags) as tag
  ) as a,
  localized
  group by language
$_$;

CREATE OR REPLACE FUNCTION get_localized_tags(language text, tags text[]) returns localized_value[]
  LANGUAGE sql STABLE
  AS $_$
SELECT COALESCE(get_localized_tags_or_null(language, tags), '{}');
$_$;
