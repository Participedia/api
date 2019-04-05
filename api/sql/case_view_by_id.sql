SELECT row_to_json(results.*) as results from (
SELECT
  id,
  type,
  title,
  get_case_view_localized_list(${lang},'general_issues', general_issues) as general_issues,
  get_case_view_localized_list(${lang},'specific_topics', specific_topics) as specific_topics,
  description,
  body,
  get_localized_tags(${lang}, tags) as tags,
  location_name,
  address1,
  address2,
  city,
  province,
  postal_code,
  country,
  latitude,
  longitude,
  get_case_view_localized_value(${lang},'scope_of_influence', scope_of_influence) as scope_of_influence,
  get_components(id, ${lang}) as has_components,
  get_object_title(is_component_of, ${lang}) as is_component_of,
  full_files as files,
  full_links as links,
  photos,
  full_videos as videos,
  audio,
  start_date,
  end_date,
  ongoing,
  get_case_view_localized_value(${lang},'time_limited', time_limited) as time_limited,
  get_case_view_localized_list(${lang},'purposes', purposes) as purposes,
  get_case_view_localized_list(${lang},'approaches', approaches) as approaches,
  get_case_view_localized_value(${lang},'public_spectrum', public_spectrum) as public_spectrum,
  number_of_participants,
  get_case_view_localized_value(${lang},'open_limited', open_limited) as open_limited,
  get_case_view_localized_value(${lang},'recruitment_method', recruitment_method) as recruitment_method,
  get_case_view_localized_list(${lang},'targeted_participants', targeted_participants) as targeted_participants,
  get_case_view_localized_list(${lang},'method_types', method_types) as method_types,
  get_case_view_localized_list(${lang},'tools_techniques_types', tools_techniques_types) as tools_techniques_types,
  get_object_title_list(specific_methods_tools_techniques, ${lang}),
  get_case_view_localized_value(${lang},'legality', legality) as legality,
  get_case_view_localized_value(${lang},'facilitators', facilitators) as facilitators,
  get_case_view_localized_value(${lang},'facilitator_training', facilitator_training) as facilitator_training,
  get_case_view_localized_value(${lang},'facetoface_online_or_both', facetoface_online_or_both) as facetoface_online_or_both,
  get_case_view_localized_list(${lang},'participants_interactions', participants_interactions)  as participants_interactions,
  get_case_view_localized_list(${lang},'learning_resources', learning_resources) as learning_resources,
  get_case_view_localized_list(${lang},'decision_methods', decision_methods) as decision_methods,
  get_case_view_localized_list(${lang},'if_voting', if_voting) as if_voting,
  get_case_view_localized_list(${lang},'insights_outcomes', insights_outcomes) as insights_outcomes,
  get_object_title(primary_organizer, ${lang}) as primary_organizer,
  get_case_view_localized_list(${lang},'organizer_types', organizer_types) as organizer_types,
  funder,
  get_case_view_localized_list(${lang},'funder_types', funder_types) as funder_types,
  staff,
  volunteers,
  impact_evidence,
  get_case_view_localized_list(${lang},'change_types', change_types) as change_types,
  get_case_view_localized_list(${lang},'implementers_of_change', implementers_of_change) as implementers_of_change,
  formal_evaluation,
  evaluation_reports,
  evaluation_links,
  bookmarked('case', ${articleid}, ${userid}),
  first_author(${articleid}) AS creator,
  last_author(${articleid}) AS last_updated_by,

  original_language,
  post_date,
  published,
  updated_date,
  featured,
  hidden
FROM
  cases,
  get_localized_texts(${articleid}, ${lang}) as localized_texts
WHERE
  cases.id = ${articleid}

) AS results ;
