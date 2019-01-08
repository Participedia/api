import header from './header.js';
import elementClosestPolyfill from './polyfills/element.closest.polyfill.js';
import editMultiSelect from './edit-multi-select.js';
import editRichText from './edit-rich-text.js';
import editLocation from './edit-location.js';
import editMedia from './edit-media.js';
import editLinkSet from './edit-link-set.js';
import editLinkList from './edit-link-list.js';
import editWarning from './edit-warning.js';

// polyfills
elementClosestPolyfill();

// common
header.init();

// case edit form
// only init edit form fields if on edit page
// todo: handle dynamic imports of edit field js so we don't import if not needed
if (window.location.pathname.indexOf('edit') > 0) {
  editMultiSelect.init();
  editRichText.init();
  editLocation.init();
  editLinkSet.init();
  editLinkList.init();
  editMedia.init();
  editWarning.init();
}
