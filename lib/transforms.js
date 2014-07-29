var _ = require('underscore');

// Extend Date due to inconsistencies with Date.parse in browsers
// http://dygraphs.com/date-formats.html
if (!Date.fromJSON) {
	Date.fromJSON = function(value) {
		if (_.isString(value)) {
			value = value
				.replace(/\.\d\d\d+/, '')
				.replace(/-/g, '/')
				.replace('T', ' ')
				.replace(/(Z)?$/, ' UTC');
		}

		return new Date(value);
	};
}
