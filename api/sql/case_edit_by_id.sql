-- FIXME: Once this is working, duplicate for case_view_by_id.sql
SELECT row_to_json(
SELECT
  id,
  type,
  title,
  get_case_edit_localized_list('general_issues', general_issues) as general_issues,
  get_case_edit_localized_list('specific_topics', specific_topics) as specific_topics,
  description,
  body,
  get_localized_tags(${language}, tags) as tags,
  location_name,
  address1,
  address2,
  city,
  province,
  postal_code,
  country,
  latitude,
  longitude,
  get_case_edit_localized_value('scope', scope_of_influence) as scope_of_influence,
  get_components(${}, language) as has_components,
  get_object_title(is_component_of, language) as is_component_of,
  full_files as files,
  full_links as links,
  photos,
  full_videos as videos,
  audio,
  start_date,
  end_date,
  ongoing,
  get_case_edit_localized_value('time_limited', time_limited) as time_limited,
  get_case_edit_localized_list('purposes', purposes) as purposes,
  get_case_edit_localized_list('approaches', approaches) as approaches,
  get_case_edit_localized_value('public_spectrum', public_spectrum) as public_spectrum,
  number_of_participants,
  get_case_edit_localized_value('open_limited', open_limited) as open_limited,
  get_case_edit_localized_value('recruitment_method', recruitment_method) as recruitement_method,
  get_case_edit_localized_list('targeted_participants', targeted_participants) as targeted_participants,
  get_case_edit_localized_list('method_types', method_types) as method_types,
  get_case_edit_localized_list('tools_techniques_types', tools_techniques_types) as tools_techniques_types,
  get_object_title_list(specific_methods_tools_techniques, language),
  get_case_edit_localized_value('legality', legality) as legality,
  get_case_edit_localized_value('facilitators', facilitators) as facilitators,
  get_case_edit_localized_value('facilitator_training', facilitator_training) as facilitator_training,
  get_case_edit_localized_value('facetoface_online_or_both', facetoface_online_or_both) as facetoface_online_or_both,
  get_case_edit_localized_list('participants_interactions', participants_interactions)  as participants_interactions,
  get_case_edit_localized_list('learning_resources', learning_resources) as learning_resources,
  get_case_edit_localized_list('decision_methods', decision_methods) as decision_methods,
  get_case_edit_localized_list('if_voting', if_voting) as if_voting,
  get_case_edit_localized_list('insights_outcomes', insights_outcomes) as insights_outcomes,
  get_object_title(primary_organizer, language) as primary_organizer,
  get_case_edit_localized_list('organizer_types', organizer_types) as organizer_types,
  funder,
  get_case_edit_localized_list('funder_types', funder_types) as funder_types,
  staff,
  volunteers,
  impact_evidence,
  get_case_edit_localized_list('change_types', change_types) as change_types,
  get_case_edit_localized_list('implementers_of_change', implementers_of_change) as implementers_of_change,
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
