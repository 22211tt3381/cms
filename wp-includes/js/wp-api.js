/**
 * @output wp-includes/js/wp-api.js
 */

(function( window, undefined ) {

	'use strict';

	/**
	 * Initialize the WP_API.
	 */
	function WP_API() {
		/** @namespace wp.api.models */
		this.models = {};
		/** @namespace wp.api.collections */
		this.collections = {};
		/** @namespace wp.api.views */
		this.views = {};
	}

	/** @namespace wp */
	window.wp            = window.wp || {};
	/** @namespace wp.api */
	wp.api               = wp.api || new WP_API();
	wp.api.versionString = wp.api.versionString || 'wp/v2/';

	// Alias _includes to _.contains, ensuring it is available if lodash is used.
	if ( ! _.isFunction( _.includes ) && _.isFunction( _.contains ) ) {
	  _.includes = _.contains;
	}

})( window );

(function( window, undefined ) {

	'use strict';

	var pad, r;

	/** @namespace wp */
	window.wp = window.wp || {};
	/** @namespace wp.api */
	wp.api = wp.api || {};
	/** @namespace wp.api.utils */
	wp.api.utils = wp.api.utils || {};

	/**
	 * Determine model based on API route.
	 *
	 * @param {string} route    The API route.
	 *
	 * @return {Backbone Model} The model found at given route. Undefined if not found.
	 */
	wp.api.getModelByRoute = function( route ) {
		return _.find( wp.api.models, function( model ) {
			return model.prototype.route && route === model.prototype.route.index;
		} );
	};

	/**
	 * Determine collection based on API route.
	 *
	 * @param {string} route    The API route.
	 *
	 * @return {Backbone Model} The collection found at given route. Undefined if not found.
	 */
	wp.api.getCollectionByRoute = function( route ) {
		return _.find( wp.api.collections, function( collection ) {
			return collection.prototype.route && route === collection.prototype.route.index;
		} );
	};


	/**
	 * ECMAScript 5 shim, adapted from MDN.
	 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
	 */
	if ( ! Date.prototype.toISOString ) {
		pad = function( number ) {
			r = String( number );
			if ( 1 === r.length ) {
				r = '0' + r;
			}

			return r;
		};

		Date.prototype.toISOString = function() {
			return this.getUTCFullYear() +
				'-' + pad( this.getUTCMonth() + 1 ) +
				'-' + pad( this.getUTCDate() ) +
				'T' + pad( this.getUTCHours() ) +
				':' + pad( this.getUTCMinutes() ) +
				':' + pad( this.getUTCSeconds() ) +
				'.' + String( ( this.getUTCMilliseconds() / 1000 ).toFixed( 3 ) ).slice( 2, 5 ) +
				'Z';
		};
	}

	/**
	 * Parse date into ISO8601 format.
	 *
	 * @param {Date} date.
	 */
	wp.api.utils.parseISO8601 = function( date ) {
		var timestamp, struct, i, k,
			minutesOffset = 0,
			numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];

		/*
		 * ES5 ֲ§15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
		 * before falling back to any implementation-specific date parsing, so thatג€™s what we do, even if native
		 * implementations could be faster.
		 */
		//              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ֲ±    10 tzHH    11 tzmm
		if ( ( struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec( date ) ) ) {

			// Avoid NaN timestamps caused by ג€undefinedג€ values being passed to Date.UTC.
			for ( i = 0; ( k = numericKeys[i] ); ++i ) {
				struct[k] = +struct[k] || 0;
			}

			// Allow undefined days and months.
			struct[2] = ( +struct[2] || 1 ) - 1;
			struct[3] = +struct[3] || 1;

			if ( 'Z' !== struct[8]  && undefined !== struct[9] ) {
				minutesOffset = struct[10] * 60 + struct[11];

				if ( '+' === struct[9] ) {
					minutesOffset = 0 - minutesOffset;
				}
			}

			timestamp = Date.UTC( struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7] );
		} else {
			timestamp = Date.parse ? Date.parse( date ) : NaN;
		}

		return timestamp;
	};

	/**
	 * Helper function for getting the root URL.
	 * @return {[type]} [description]
	 */
	wp.api.utils.getRootUrl = function() {
		return window.location.origin ?
			window.location.origin + '/' :
			window.location.protocol + '//' + window.location.host + '/';
	};

	/**
	 * Helper for capitalizing strings.
	 */
	wp.api.utils.capitalize = function( str ) {
		if ( _.isUndefined( str ) ) {
			return str;
		}
		return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
	};

	/**
	 * Helper function that capitalizes the first word and camel cases any words starting
	 * after dashes, removing the dashes.
	 */
	wp.api.utils.capitalizeAndCamelCaseDashes = function( str ) {
		if ( _.isUndefined( str ) ) {
			return str;
		}
		str = wp.api.utils.capitalize( str );

		return wp.api.utils.camelCaseDashes( str );
	};

	/**
	 * Helper function to camel case the letter after dashes, removing the dashes.
	 */
	wp.api.utils.camelCaseDashes = function( str ) {
		return str.replace( /-([a-z])/g, function( g ) {
			return g[ 1 ].toUpperCase();
		} );
	};

	/**
	 * Extract a route part based on negative index.
	 *
	 * @param {string}   route          The endpoint route.
	 * @param {number}   part           The number of parts from the end of the route to retrieve. Default 1.
	 *                                  Example route `/a/b/c`: part 1 is `c`, part 2 is `b`, part 3 is `a`.
	 * @param {string}  [versionString] Version string, defaults to `wp.api.versionString`.
	 * @param {boolean} [reverse]       Whether to reverse the order when extracting the route part. Optional, default false.
	 */
	wp.api.utils.extractRoutePart = function( route, part, versionString, reverse ) {
		var routeParts;

		part = part || 1;
		versionString = versionString || wp.api.versionString;

		// Remove versions string from route to avoid returning it.
		if ( 0 === route.indexOf( '/' + versionString ) ) {
			route = route.substr( versionString.length + 1 );
		}

		routeParts = route.split( '/' );
		if ( reverse ) {
			routeParts = routeParts.reverse();
		}
		if ( _.isUndefined( routeParts[ --part ] ) ) {
			return '';
		}
		return routeParts[ part ];
	};

	/**
	 * Extract a parent name from a passed route.
	 *
	 * @param {string} route The route to extract a name from.
	 */
	wp.api.utils.extractParentName = function( route ) {
		var name,
			lastSlash = route.lastIndexOf( '_id>[\\d]+)/' );

		if ( lastSlash < 0 ) {
			return '';
		}
		name = route.substr( 0, lastSlash - 1 );
		name = name.split( '/' );
		name.pop();
		name = name.pop();
		return name;
	};

	/**
	 * Add args and options to a model prototype from a route's endpoints.
	 *
	 * @param {Array}  routeEndpoints Array of route endpoints.
	 * @param {Object} modelInstance  An instance of the model (or collection)
	 *                                to add the args to.
	 */
	wp.api.utils.decorateFromRoute = function( routeEndpoints, modelInstance ) {

		/**
		 * Build the args based on route endpoint data.
		 */
		_.each( routeEndpoints, function( routeEndpoint ) {

			// Add post and edit endpoints as model args.
			if ( _.includes( routeEndpoint.methods, 'POST' ) || _.includes( routeEndpoint.methods, 'PUT' ) ) {

				// Add any non-empty args, merging them into the args object.
				if ( ! _.isEmpty( routeEndpoint.args ) ) {

					// Set as default if no args yet.
					if ( _.isEmpty( modelInstance.prototype.args ) ) {
						modelInstance.prototype.args = routeEndpoint.args;
					} else {

						// We already have args, merge these new args in.
						modelInstance.prototype.args = _.extend( modelInstance.prototype.args, routeEndpoint.args );
					}
				}
			} else {

				// Add GET method as model options.
				if ( _.includes( routeEndpoint.methods, 'GET' ) ) {

					// Add any non-empty args, merging them into the defaults object.
					if ( ! _.isEmpty( routeEndpoint.args ) ) {

						// Set as default if no defaults yet.
						if ( _.isEmpty( modelInstance.prototype.options ) ) {
							modelInstance.prototype.options = routeEndpoint.args;
						} else {

							// We already have options, merge these new args in.
							modelInstance.prototype.options = _.extend( modelInstance.prototype.options, routeEndpoint.args );
						}
					}

				}
			}

		} );

	};

	/**
	 * Add mixins and helpers to models depending on their defaults.
	 *
	 * @param {Backbone Model} model          The model to attach helpers and mixins to.
	 * @param {string}         modelClassName The classname of the constructed model.
	 * @param {Object} 	       loadingObjects An object containing the models and collections we are building.
	 */
	wp.api.utils.addMixinsAndHelpers = function( model, modelClassName, loadingObjects ) {

		var hasDate = false,

			/**
			 * Array of parseable dates.
			 *
			 * @type {string[]}.
			 */
			parseableDates = [ 'date', 'modified', 'date_gmt', 'modified_gmt' ],

			/**
			 * Mixin for all content that is time stamped.
			 *
			 * This mixin converts between mysql timestamps and JavaScript Dates when syncing a model
			 * to or from the server. For example, a date stored as `2015-12-27T21:22:24` on the server
			 * gets expanded to `Sun Dec 27 2015 14:22:24 GMT-0700 (MST)` when the model is fetched.
			 *
			 * @type {{toJSON: toJSON, parse: parse}}.
			 */
			TimeStampedMixin = {

				/**
				 * Prepare a JavaScript Date for transmitting to the server.
				 *
				 * This helper function accepts a field and Date object. It converts the passed Date
				 * to an ISO string and sets that on the model field.
				 *
				 * @param {Date}   date   A JavaScript date object. WordPress expects dates in UTC.
				 * @param {string} field  The date field to set. One of 'date', 'date_gmt', 'date_modified'
				 *                        or 'date_modified_gmt'. Optional, defaults to 'date'.
				 */
				setDate: function( date, field ) {
					var theField = field || 'date';

					// Don't alter non-parsable date fields.
					if ( _.indexOf( parseableDates, theField ) < 0 ) {
						return false;
					}

					this.set( theField, date.toISOString() );
				},

				/**
				 * Get a JavaScript Date from the passed field.
				 *
				 * WordPress returns 'date' and 'date_modified' in the timezone of the server as well as
				 * UTC dates as 'date_gmt' and 'date_modified_gmt'. Draft posts do not include UTC dates.
				 *
				 * @param {string} field  The date field to set. One of 'date', 'date_gmt', 'date_modified'
				 *                        or 'date_modified_gmt'. Optional, defaults to 'date'.
				 */
				getDate: function( field ) {
					var theField   = field || 'date',
						theISODate = this.get( theField );

					// Only get date fields and non-null values.
					if ( _.indexOf( parseableDates, theField ) < 0 || _.isNull( theISODate ) ) {
						return false;
					}

					return new Date( wp.api.utils.parseISO8601( theISODate ) );
				}
			},

			/**
			 * Build a helper function to retrieve related model.
			 *
			 * @param {string} parentModel      The parent model.
			 * @param {number} modelId          The model ID if the object to request
			 * @param {string} modelName        The model name to use when constructing the model.
			 * @param {string} embedSourcePoint Where to check the embedded object for _embed data.
			 * @param {string} embedCheckField  Which model field to check to see if the model has data.
			 *
			 * @return {Deferred.promise}        A promise which resolves to the constructed model.
			 */
			buildModelGetter = function( parentModel, modelId, modelName, embedSourcePoint, embedCheckField ) {
				var getModel, embeddedObjects, attributes, deferred;

				deferred        = jQuery.Deferred();
				embeddedObjects = parentModel.get( '_embedded' ) || {};

				// Verify that we have a valid object id.
				if ( ! _.isNumber( modelId ) || 0 === modelId ) {
					deferred.reject();
					return deferred;
				}

				// If we have embedded object data, use that when constructing the getModel.
				if ( embeddedObjects[ embedSourcePoint ] ) {
					attributes = _.findWhere( embeddedObjects[ embedSourcePoint ], { id: modelId } );
				}

				// Otherwise use the modelId.
				if ( ! attributes ) {
					attributes = { id: modelId };
				}

				// Create the new getModel model.
				getModel = new wp.api.models[ modelName ]( attributes );

				if ( ! getModel.get( embedCheckField ) ) {
					getModel.fetch( {
						success: function( getModel ) {
							deferred.resolve( getModel );
						},
						error: function( getModel, response ) {
							deferred.reject( response );
						}
					} );
				} else {
					// Resolve with the embedded model.
					deferred.resolve( getModel );
				}

				// Return a promise.
				return deferred.promise();
			},

			/**
			 * Build a helper to retrieve a collection.
			 *
			 * @param {string} parentModel      The parent model.
			 * @param {string} collectionName   The name to use when constructing the collection.
			 * @param {string} embedSourcePoint Where to check the embedded object for _embed data.
			 * @param {string} embedIndex       An additional optional index for the _embed data.
			 *
			 * @return {Deferred.promise} A promise which resolves to the constructed collection.
			 */
			buildCollectionGetter = function( parentModel, collectionName, embedSourcePoint, embedIndex ) {
				/**
				 * Returns a promise that resolves to the requested collection
				 *
				 * Uses the embedded data if available, otherwise fetches the
				 * data from the server.
				 *
				 * @return {Deferred.promise} promise Resolves to a wp.api.collections[ collectionName ]
				 * collection.
				 */
				var postId, embeddedObjects, getObjects,
					classProperties = '',
					properties      = '',
					deferred        = jQuery.Deferred();

				postId          = parentModel.get( 'id' );
				embeddedObjects = parentModel.get( '_embedded' ) || {};

				// Verify that we have a valid post ID.
				if ( ! _.isNumber( postId ) || 0 === postId ) {
					deferred.reject();
					return deferred;
				}

				// If we have embedded getObjects data, use that when constructing the getObjects.
				if ( ! _.isUndefined( embedSourcePoint ) && ! _.isUndefined( embeddedObjects[ embedSourcePoint ] ) ) {

					// Some embeds also include an index offset, check for that.
					if ( _.isUndefined( embedIndex ) ) {

						// Use the embed source point directly.
						properties = embeddedObjects[ embedSourcePoint ];
					} else {

						// Add the index to the embed source point.
						properties = embeddedObjects[ embedSourcePoint ][ embedIndex ];
					}
				} else {

					// Otherwise use the postId.
					classProperties = { parent: postId };
				}

				// Create the new getObjects collection.
				getObjects = new wp.api.collections[ collectionName ]( properties, classProperties );

				// If we didnג€™t have embedded getObjects, fetch the getObjects data.
				if ( _.isUndefined( getObjects.models[0] ) ) {
					getObjects.fetch( {
						success: function( getObjects ) {

							// Add a helper 'parent_post' attribute onto the model.
							setHelperParentPost( getObjects, postId );
							deferred.resolve( getObjects );
						},
						error: function( getModel, response ) {
							deferred.reject( response );
						}
					} );
				} else {

					// Add a helper 'parent_post' attribute onto the model.
					setHelperParentPost( getObjects, postId );
					deferred.resolve( getObjects );
				}

				// Return a promise.
				return deferred.promise();

			},

			/**
			 * Set the model post parent.
			 */
			setHelperParentPost = function( collection, postId ) {

				// Attach post_parent id to the collection.
				_.each( collection.models, function( model ) {
					model.set( 'parent_post', postId );
				} );
			},

			/**
			 * Add a helper function to handle post Meta.
			 */
			MetaMixin = {

				/**
				 * Get meta by key for a post.
				 *
				 * @param {string} key The meta key.
				 *
				 * @return {Object} The post meta value.
				 */
				getMeta: function( key ) {
					var metas = this.get( 'meta' );
					return metas[ key ];
				},

				/**
				 * Get all meta key/values for a post.
				 *
				 * @return {Object} The post metas, as a key value pair object.
				 */
				getMetas: function() {
					return this.get( 'meta' );
				},

				/**
				 * Set a group of meta key/values for a post.
				 *
				 * @param {Object} meta The post meta to set, as key/value pairs.
				 */
				setMetas: function( meta ) {
					var metas = this.get( 'meta' );
					_.extend( metas, meta );
					this.set( 'meta', metas );
				},

				/**
				 * Set a single meta value for a post, by key.
				 *
				 * @param {string} key   The meta key.
				 * @param {Object} value The meta value.
				 */
				setMeta: function( key, value ) {
					var metas = this.get( 'meta' );
					metas[ key ] = value;
					this.set( 'meta', metas );
				}
			},

			/**
			 * Add a helper function to handle post Revisions.
			 */
			RevisionsMixin = {
				getRevisions: function() {
					return buildCollectionGetter( this, 'PostRevisions' );
				}
			},

			/**
			 * Add a helper function to handle post Tags.
			 */
			TagsMixin = {

				/**
				 * Get the tags for a post.
				 *
				 * @return {Deferred.promise} promise Resolves to an array of tags.
				 */
				getTags: function() {
					var tagIds = this.get( 'tags' ),
						tags  = new wp.api.collections.Tags();

					// Resolve with an empty array if no tags.
					if ( _.isEmpty( tagIds ) ) {
						return jQuery.Deferred().resolve( [] );
					}

					return tags.fetch( { data: { include: tagIds } } );
				},

				/**
				 * Set the tags for a post.
				 *
				 * Accepts an array of tag slugs, or a Tags collection.
				 *
				 * @param {Array|Backbone.Collection} tags The tags to set on the post.
				 *
				 */
				setTags: function( tags ) {
					var allTags, newTag,
						self = this,
						newTags = [];

					if ( _.isString( tags ) ) {
						return false;
					}

					// If this is an array of slugs, build a collection.
					if ( _.isArray( tags ) ) {

						// Get all the tags.
						allTags = new wp.api.collections.Tags();
						allTags.fetch( {
							data:    { per_page: 100 },
							success: function( alltags ) {

								// Find the passed tags and set them up.
								_.each( tags, function( tag ) {
									newTag = new wp.api.models.Tag( alltags.findWhere( { slug: tag } ) );

									// Tie the new tag to the post.
									newTag.set( 'parent_post', self.get( 'id' ) );

									// Add the new tag to the collection.
									newTags.push( newTag );
								} );
								tags = new wp.api.collections.Tags( newTags );
								self.setTagsWithCollection( tags );
							}
						} );

					} else {
						this.setTagsWithCollection( tags );
					}
				},

				/**
				 * Set the tags for a post.
				 *
				 * Accepts a Tags collection.
				 *
				 * @param {Array|Backbone.Collection} tags The tags to set on the post.
				 *
				 */
				setTagsWithCollection: function( tags ) {

					// Pluck out the category IDs.
					this.set( 'tags', tags.pluck( 'id' ) );
					return this.save();
				}
			},

			/**
			 * Add a helper function to handle post Categories.
			 */
			CategoriesMixin = {

				/**
				 * Get a the categories for a post.
				 *
				 * @return {Deferred.promise} promise Resolves to an array of categories.
				 */
				getCategories: function() {
					var categoryIds = this.get( 'categories' ),
						categories  = new wp.api.collections.Categories();

					// Resolve with an empty array if no categories.
					if ( _.isEmpty( categoryIds ) ) {
						return jQuery.Deferred().resolve( [] );
					}

					return categories.fetch( { data: { include: categoryIds } } );
				},

				/**
				 * Set the categories for a post.
				 *
				 * Accepts an array of category slugs, or a Categories collection.
				 *
				 * @param {Array|Backbone.Collection} categories The categories to set on the post.
				 *
				 */
				setCategories: function( categories ) {
					var allCategories, newCategory,
						self = this,
						newCategories = [];

					if ( _.isString( categories ) ) {
						return false;
					}

					// If this is an array of slugs, build a collection.
					if ( _.isArray( categories ) ) {

						// Get all the categories.
						allCategories = new wp.api.collections.Categories();
						allCategories.fetch( {
							data:    { per_page: 100 },
							success: function( allcats ) {

								// Find the passed categories and set them up.
								_.each( categories, function( category ) {
									newCategory = new wp.api.models.Category( allcats.findWhere( { slug: category } ) );

									// Tie the new category to the post.
									newCategory.set( 'parent_post', self.get( 'id' ) );

									// Add the new category to the collection.
									newCategories.push( newCategory );
								} );
								categories = new wp.api.collections.Categories( newCategories );
								self.setCategoriesWithCollection( categories );
							}
						} );

					} else {
						this.setCategoriesWithCollection( categories );
					}

				},

				/**
				 * Set the categories for a post.
				 *
				 * Accepts Categories collection.
				 *
				 * @param {Array|Backbone.Collection} categories The categories to set on the post.
				 *
				 */
				setCategoriesWithCollection: function( categories ) {

					// Pluck out the category IDs.
					this.set( 'categories', categories.pluck( 'id' ) );
					return this.save();
				}
			},

			/**
			 * Add a helper function to retrieve the author user model.
			 */
			AuthorMixin = {
				getAuthorUser: function() {
					return buildModelGetter( this, this.get( 'author' ), 'User', 'author', 'name' );
				}
			},

			/**
			 * Add a helper function to retrieve the featured media.
			 */
			FeaturedMediaMixin = {
				getFeaturedMedia: function() {
					return buildModelGetter( this, this.get( 'featured_media' ), 'Media', 'wp:featuredmedia', 'source_url' );
				}
			};

		// Exit if we don't have valid model defaults.
		if ( _.isUndefined( model.prototype.args ) ) {
			return model;
		}

		// Go thru the parsable date fields, if our model contains any of them it gets the TimeStampedMixin.
		_.each( parseableDates, function( theDateKey ) {
			if ( ! _.isUndefined( model.prototype.args[ theDateKey ] ) ) {
				hasDate = true;
			}
		} );

		// Add the TimeStampedMixin for models that contain a date field.
		if ( hasDate ) {
			model = model.extend( TimeStampedMixin );
		}

		// Add the AuthorMixin for models that contain an author.
		if ( ! _.isUndefined( model.prototype.args.author ) ) {
			model = model.extend( AuthorMixin );
		}

		// Add the FeaturedMediaMixin for models that contain a featured_media.
		if ( ! _.isUndefined( model.prototype.args.featured_media ) ) {
			model = model.extend( FeaturedMediaMixin );
		}

		// Add the CategoriesMixin for models that support categories collections.
		if ( ! _.isUndefined( model.prototype.args.categories ) ) {
			model = model.extend( CategoriesMixin );
		}

		// Add the MetaMixin for models that support meta.
		if ( ! _.isUndefined( model.prototype.args.meta ) ) {
			model = model.extend( MetaMixin );
		}

		// Add the TagsMixin for models that support tags collections.
		if ( ! _.isUndefined( model.prototype.args.tags ) ) {
			model = model.extend( TagsMixin );
		}

		// Add the RevisionsMixin for models that support revisions collections.
		if ( ! _.isUndefined( loadingObjects.collections[ modelClassName + 'Revisions' ] ) ) {
			model = model.extend( RevisionsMixin );
		}

		return model;
	};

})( window );

/* global wpApiSettings:false */

// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function() {

	'use strict';

	var wpApiSettings = window.wpApiSettings || {},
	trashableTypes    = [ 'Comment', 'Media', 'Comment', 'Post', 'Page', 'Status', 'Taxonomy', 'Type' ];

	/**
	 * Backbone base model for all models.
	 */
	wp.api.WPApiBaseModel = Backbone.Model.extend(
		/** @lends WPApiBaseModel.prototype  */
		{

			// Initialize the model.
			initialize: function() {

				/**
				* Types that don't support trashing require passing ?force=true to delete.
				*
				*/
				if ( -1 === _.indexOf( trashableTypes, this.name ) ) {
					this.requireForceForDelete = true;
				}
			},

			/**
			 * Set nonce header before every Backbone sync.
			 *
			 * @param {string} method.
			 * @param {Backbone.Model} model.
			 * @param {{beforeSend}, *} options.
			 * @return {*}.
			 */
			sync: function( method, model, options ) {
				var beforeSend;

				options = options || {};

				// Remove date_gmt if null.
				if ( _.isNull( model.get( 'date_gmt' ) ) ) {
					model.unset( 'date_gmt' );
				}

				// Remove slug if empty.
				if ( _.isEmpty( model.get( 'slug' ) ) ) {
					model.unset( 'slug' );
				}

				if ( _.isFunction( model.nonce ) && ! _.isEmpty( model.nonce() ) ) {
					beforeSend = options.beforeSend;

					// @todo Enable option for jsonp endpoints.
					// options.dataType = 'jsonp';

					// Include the nonce with requests.
					options.beforeSend = function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', model.nonce() );

						if ( beforeSend ) {
							return beforeSend.apply( this, arguments );
						}
					};

					// Update the nonce when a new nonce is returned with the response.
					options.complete = function( xhr ) {
						var returnedNonce = xhr.getResponseHeader( 'X-WP-Nonce' );

						if ( returnedNonce && _.isFunction( model.nonce ) && model.nonce() !== returnedNonce ) {
							model.endpointModel.set( 'nonce', returnedNonce );
						}
					};
				}

				// Add '?force=true' to use delete method when required.
				if ( this.requireForceForDelete && 'delete' === method ) {
					model.url = model.url() + '?force=true';
				}
				return Backbone.sync( method, model, options );
			},

			/**
			 * Save is only allowed when the PUT OR POST methods are available for the endpoint.
			 */
			save: function( attrs, options ) {

				// Do we have the put method, then execute the save.
				if ( _.includes( this.methods, 'PUT' ) || _.includes( this.methods, 'POST' ) ) {

					// Proxy the call to the original save function.
					return Backbone.Model.prototype.save.call( this, attrs, options );
				} else {

					// Otherwise bail, disallowing action.
					return false;
				}
			},

			/**
			 * Delete is only allowed when the DELETE method is available for the endpoint.
			 */
			destroy: function( options ) {

				// Do we have the DELETE method, then execute the destroy.
				if ( _.includes( this.methods, 'DELETE' ) ) {

					// Proxy the call to the original save function.
					return Backbone.Model.prototype.destroy.call( this, options );
				} else {

					// Otherwise bail, disallowing action.
					return false;
				}
			}

		}
	);

	/**
	 * API Schema model. Contains meta information about the API.
	 */
	wp.api.models.Schema = wp.api.WPApiBaseModel.extend(
		/** @lends Schema.prototype  */
		{
			defaults: {
				_links: {},
				namespace: null,
				routes: {}
			},

			initialize: function( attributes, options ) {
				var model = this;
				options = options || {};

				wp.api.WPApiBaseModel.prototype.initialize.call( model, attributes, options );

				model.apiRoot = options.apiRoot || wpApiSettings.root;
				model.versionString = options.versionString || wpApiSettings.versionString;
			},

			url: function() {
				return this.apiRoot + this.versionString;
			}
		}
	);
})();

( function() {

	'use strict';

	var wpApiSettings = window.wpApiSettings || {};

	/**
	 * Contains basic collection functionality such as pagination.
	 */
	wp.api.WPApiBaseCollection = Backbone.Collection.extend(
		/** @lends BaseCollection.prototype  */
		{

			/**
			 * Setup default state.
			 */
			initialize: function( models, options ) {
				this.state = {
					data: {},
					currentPage: null,
					totalPages: null,
					totalObjects: null
				};
				if ( _.isUndefined( options ) ) {
					this.parent = '';
				} else {
					this.parent = options.parent;
				}
			},

			/**
			 * Extend Backbone.Collection.sync to add nince and pagination support.
			 *
			 * Set nonce header before every Backbone sync.
			 *
			 * @param {string} method.
			 * @param {Backbone.Model} model.
			 * @param {{success}, *} options.
			 * @return {*}.
			 */
			sync: function( method, model, options ) {
				var beforeSend, success,
					self = this;

				options = options || {};

				if ( _.isFunction( model.nonce ) && ! _.isEmpty( model.nonce() ) ) {
					beforeSend = options.beforeSend;

					// Include the nonce with requests.
					options.beforeSend = function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', model.nonce() );

						if ( beforeSend ) {
							return beforeSend.apply( se   ״        gשÿÊ    ‡                    ״      `÷×V÷ÿÿ8נW÷ÿÿ,  ; × "Pת7ע:נעL¡=זָ    ״   ט   €W €,  ; × "Pת7ע:נעL¡­זָ    ״   ט   €, × ,  ; × "Pת7ע:נעL¡’¯חָ    ״   ט   €ךUÿ<,  ; × "Pת7ע:נעL¡&בלָ    ״   ט   €÷ÿÿ,  ; × "Pת7ע:נעL¡ר¼מָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡%נָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡א]סָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡F/עָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡‘צָ    ״   ט   €2   ,  ; × "Pת7ע:נעL¡ז‏ָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡<Pÿָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ָÿָ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡n•ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ֳםVֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡U_Zֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ו\ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡־_ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡½ `ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡°©cֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ױ‘ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ֶ¥”ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡$÷ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡9<£ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ֿÜ¥ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡י¸ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡פר״ֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡!Ûֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡,ָןֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡÷¿פֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡Ýתקֹ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡YÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡@ Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡פ¸"Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡זÚ$Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡=%Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡p&Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡v&Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡נִ&Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡#9'Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ּ®/Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡sH2Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡=4Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡¶§4Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡Ý5Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡nk6Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ֽ<Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡·5ZÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡;מ[Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡VcÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡‡dÊ    ט   ט   €ט  ,  ; × "Pת7ע:נעL¡›שdÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡}pÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡‚Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡®	‹Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡IÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ÚÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡*v”Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡™ך”Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡½J˜Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡׀˜Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡‎™Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡m’Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡צÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡װ¬¹Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡L'»Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ׁ«»Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ױ¼Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ף"ֲÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡IgֳÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡‰nÊÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡8םׂÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡+aװÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡U¿װÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ûÙ׳Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ÿפÝÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡³WחÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡-ןÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡8°ןÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡¯±סÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡AעץÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ם}רÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡»cשÊ    ״   ט   €ט  ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ   ״        2$ֻ                         ״      8א¯V÷ÿÿ8 ¹V÷ÿÿ,  ; × "Pת7ע:נעL¡—¼Ê    ״   ט   € × ,  ; × "Pת7ע:נעL¡s¶Ê    ״   ט   €E \ ,  ; × "Pת7ע:נעL¡M* Ê    ״   ט   €o s ,  ; × "Pת7ע:נעL¡Mה¥Ê    ״   ט   €a r ,  ; × "Pת7ע:נעL¡Rט×Ê    ״   ט   € × ,  ; × "Pת7ע:נעL¡ûW²Ê    ״   ט   € × ,  ; × "Pת7ע:נעL¡»ױ²Ê    ״   ט   €8ׂ,<,  ; × "Pת7ע:נעL¡'׃³Ê    ״   ט   €h2,  ; × "Pת7ע:נעL¡ —·Ê    ״   ט   €h2,  ; × "Pת7ע:נעL¡ƒ÷Ê    ״   ט   €±״H2,  ; × "Pת7ע:נעL¡4©÷Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡כk¼Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ײ½Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ֶÛ¾Ê    ״   ט   €   ,  ; × "Pת7ע:נעL¡Q&ְÊ    ״   ט   €!  ,  ; × "Pת7ע:נעL¡BְÊ    ״   ט   €!  ,  ; × "Pת7ע:נעL¡XיְÊ    ״   ט   €!  ,  ; × "Pת7ע:נעL¡°_ֱÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡p»ֱÊ    ״   ט   €&*¿,  ; × "Pת7ע:נעL¡ZצֳÊ    ״   ט   € × ,  ; × "Pת7ע:נעL¡\WִÊ    ״   ט   €   ,  ; × "Pת7ע:נעL¡ֻֵÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡2ֶÊ    ״   ט   €&*¿,  ; × "Pת7ע:נעL¡ֶ½ֹÊ    ״   ט   € × ,  ; × "Pת7ע:נעL¡ֲ¦ֻÊ    ״   ט   €   ,  ; × "Pת7ע:נעL¡¼ּÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡§2׀Ê    ״   ט   €&*¿,  ; × "Pת7ע:נעL¡Ú׃Ê    ״   ט   €& × ,  ; × "Pת7ע:נעL¡ע÷ױÊ    ״   ט   €•$ 4,  ; × "Pת7ע:נעL¡b׳Ê    ״   ט   €&*¿,  ; × "Pת7ע:נעL¡mÙÊ    ״   ט   € × ,  ; × "Pת7ע:נעL¡0ÞÊ    ״   ט   €    ,  ; × "Pת7ע:נעL¡®ßÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡›¦אÊ    ״   ט   €¡ע±,  ; × "Pת7ע:נעL¡.uהÊ    ״   ט   €s k ,  ; × "Pת7ע:נעL¡`ּזÊ    ״   ט   €‏ך	,  ; × "Pת7ע:נעL¡ׁיÊ    ״   ט   €,€_,  ; × "Pת7ע:נעL¡ױ8ךÊ    ״   ט   €¡ע±,  ; × "Pת7ע:נעL¡׳ךÊ    ״   ט   €s k ,  ; × "Pת7ע:נעL¡Û‡כÊ    ״   ט   €,€_,  ; × "Pת7ע:נעL¡ךכÊ    ״   ט   €7N(,  ; × "Pת7ע:נעL¡
מÊ    ״   ט   €4 . ,  ; × "Pת7ע:נעL¡üָנÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ו?סÊ    ״   ט   €&*¿,  ; × "Pת7ע:נעL¡©oעÊ    ״   ט   € × ,  ; × "Pת7ע:נעL¡ק2ףÊ    ״   ט   €   ,  ; × "Pת7ע:נעL¡₪פÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ץֽפÊ    ״   ט   €&*¿,  ; × "Pת7ע:נעL¡fyצÊ    ״   ט   € × ,  ; × "Pת7ע:נעL¡MaקÊ    ״   ט   €   ,  ; × "Pת7ע:נעL¡	רÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡קרÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ֻשÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡))תÊ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡׃‎Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ױ‏Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡Ho ֻ    ״   ט   €   ,  ; × "Pת7ע:נעL¡ג­ֻ    ״   ט   €& × ,  ; × "Pת7ע:נעL¡ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡L	ֻ    ״   ט   €ךUÿ<,  ; × "Pת7ע:נעL¡ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡ֻ    ״   ט   €I<,  ; × "Pת7ע:נעL¡ÝÝֻ    ״   ט   €r d ,  ; × "Pת7ע:נעL¡TP	ֻ    ״   ט   €¯9=,  ; × "Pת7ע:נעL¡ו¬	ֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡ױÚ
ֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡ט3ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡ָÛֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡†Hֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡® ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡‹ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡Pֻ    ״   ט   €ךUÿ<,  ; × "Pת7ע:נעL¡Úֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡°ֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡בÙֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡D9ֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡yפֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡¦ׂֻ    ״   ט   €JBB:,  ; × "Pת7ע:נעL¡תֽֻ    ״   ט   €.=,  ; × "Pת7ע:נעL¡_ךֻ    ״   ט   €~׀4,  ; × "Pת7ע:נעL¡Aֻ    ״   ט   €b 2 ,  ; × "Pת7ע:נעL¡Þ£ֻ    ״   ט   €. e ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ   ״        :wֻ    ‰                    ״      8נW÷ÿÿ8€ֵV÷ÿÿ,  ; × "Pת7ע:נעL¡lÚ®ֹ    ״   ט   €Cbֲ/,  ; × "Pת7ע:נעL¡Eßֹ    ״   ט   €    ,  ; × "Pת7ע:נעL¡Ù\üֹ    ״   ט   €ֹ0,  ; × "Pת7ע:נעL¡ׁזÊ    ״   ט   €°ג¥7,  ; × "Pת7ע:נעL¡6Ê    ״   ט   €Cbֲ/,  ; × "Pת7ע:נעL¡Ú -Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡¿§.Ê    ״   ט   €Jך¹9,  ; × "Pת7ע:נעL¡8A/Ê    ״   ט   €ֹ0,  ; × "Pת7ע:נעL¡)ü2Ê    ״   ט   €₪,  ; × "Pת7ע:נעL¡qx3Ê    ״   ט   €Cbֲ/,  ; × "Pת7ע:נעL¡$ן9Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡<;Ê    ״   ט   €ֹ0,  ; × "Pת7ע:נעL¡f²>Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡©fUÊ    ״   ט   €t2,  ; × "Pת7ע:נעL¡ַ„\Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡¨·]Ê    ״   ט   €ֹ0,  ; × "Pת7ע:נעL¡ÚזpÊ    ״   ט   €    ,  ; × "Pת7ע:נעL¡_cqÊ    ״   ט   €t2,  ; × "Pת7ע:נעL¡׀xÊ    ״   ט   €    ,  ; × "Pת7ע:נעL¡µ›zÊ    ״   ט   €    ,  ; × "Pת7ע:נעL¡?%Ê    ״   ט   €r o ,  ; × "Pת7ע:נעL¡ƒ‘Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡eך‘Ê    ״   ט   €W   ,  ; × "Pת7ע:נעL¡7ײ•Ê    ״   ט   €W   ,  ; × "Pת7ע:נעL¡>Ê    ״   ט   €SיZ<,  ; × "Pת7ע:נעL¡״IÊ    ״   ט   €    ,  ; × "Pת7ע:נעL¡R¡Ê    ״   ט   €ֹ0,  ; × "Pת7ע:נעL¡Z†¯Ê    ״   ט   €^ײ=,  ; × "Pת7ע:נעL¡ג¯Ê    ״   ט   €SיZ<,  ; × "Pת7ע:נעL¡ֿA°Ê    ״   ט   €    ,  ; × "Pת7ע:נעL¡׳r³Ê    ״   ט   €ֹ0,  ; × "Pת7ע:נעL¡׳₪¸Ê    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ה¼Ê    ״   ט   €, × ,  ; × "Pת7ע:נעL¡U.½Ê    ״   ט   €
 × ,  ; × "Pת7ע:נעL¡~.¾Ê    ״   ט   €erM0,  ; × "Pת7ע:נעL¡µ¾Ê    ״   ט   €erM0,  ; × "Pת7ע:נעL¡ן¨ֲÊ    ״   ט   €erM0,  ; × "Pת7ע:נעL¡‎"ֶÊ    ״   ט   €erM0,  ; × "Pת7ע:נעL¡ִָֻÊ    ״   ט   €erM0,  ; × "Pת7ע:נעL¡o©בÊ    ״   ט   €|מו3,  ; × "Pת7ע:נעL¡_¯לÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡'pמÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡UװמÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡CנÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡udנÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡¹™ףÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡ZdפÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡KײצÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡ף¡üÊ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡Ú&‎Ê    ״   ט   €& × ,  ; × "Pת7ע:נעL¡¦1ÿÊ    ״   ט   €÷r=,  ; × "Pת7ע:נעL¡wÿÊ    ״   ט   €Kz6,  ; × "Pת7ע:נעL¡Nֽ ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡Ý'ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡€ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡\Xֻ    ״   ט   €•$ 4,  ; × "Pת7ע:נעL¡¹±ֻ    ״   ט   €jSP,  ; × "Pת7ע:נעL¡j‡ֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡
ֻ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡e
ֻ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡›‰ֻ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡זֻ    ״   ט   €ט  ,  ; × "Pת7ע:נעL¡ַ•ֻ    ״   ט   €c t ,  ; × "Pת7ע:נעL¡dֻ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡¬ףֻ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡‡’ֻ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡%€ֻ    ״   ט   €; × ,  ; × "Pת7ע:נעL¡03ֻ    ״   ט   €
 × ,  ; × "Pת7ע:נעL¡\Ê4ֻ    ״   ט   €Inק0,  ; × "Pת7ע:נעL¡´‹5ֻ    ״   ט   €Inק0,  ; × "Pת7ע:נעL¡<ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡ג<ֻ    ״   ט   €•צ4,  ; × "Pת7ע:נעL¡װ:Aֻ    ״   ט   €M a ,  ; × "Pת7ע:נעL¡׳GDֻ    ״   ט   €r t ,  ; × "Pת7ע:נעL¡¼ƒEֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡%ÛIֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡הMֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡׀oSֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡ל¶Vֻ    ״   ט   €ÿÿÿÿ,  ; × "Pת7ע:נעL¡™ח[ֻ    ״   ט   €ÿÿÿÿ,  ; × "Pת7ע:נעL¡מS_ֻ    ״   ט   €ÿÿÿÿ,  ; × "Pת7ע:נעL¡mץaֻ    ״   ט   €ÿÿÿÿ,  ; × "Pת7ע:נעL¡ֿ£oֻ    ״   ט   €ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ   ״        1א¾ֻ                         ״      80oV÷ÿÿ8א¯V÷ÿÿ,  ; × "Pת7ע:נעL¡2$ֻ    ״   ט   €`)  ,  ; × "Pת7ע:נעL¡Tך$ֻ    ״   ט   €l u ,  ; × "Pת7ע:נעL¡×.ֻ    ״   ט   €m d ,  ; × "Pת7ע:נעL¡O©2ֻ    ״   ט   €t i ,  ; × "Pת7ע:נעL¡ֳֿ3ֻ    ״   ט   €d m ,  ; × "Pת7ע:נעL¡)I4ֻ    ״   ט   €a l ,  ; × "Pת7ע:נעL¡Ú)6ֻ    ״   ט   €t   ,  ; × "Pת7ע:נעL¡‎“6ֻ    ״   ט   €   ,  ; × "Pת7ע:נעL¡³7ֻ    ״   ט   €s i ,  ; × "Pת7ע:נעL¡—;ֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡÷W>ֻ    ״   ט   €4!  ,  ; × "Pת7ע:נעL¡ֱ{Hֻ    ״   ט   €l u ,  ; × "Pת7ע:נעL¡ש£Jֻ    ״   ט   €m d ,  ; × "Pת7ע:נעL¡GFKֻ    ״   ט   €m 3 ,  ; × "Pת7ע:נעL¡}>Wֻ    ״   ט   €h p ,  ; × "Pת7ע:נעL¡lMYֻ    ״   ט   €\ p ,  ; × "Pת7ע:נעL¡$ßYֻ    ״   ט   €r o ,  ; × "Pת7ע:נעL¡0‹\ֻ    ״   ט   €E _ ,  ; × "Pת7ע:נעL¡÷ׂ]ֻ    ״   ט   €_ e ,  ; × "Pת7ע:נעL¡˜ּ^ֻ    ״   ט   €t a ,  ; × "Pת7ע:נעL¡n`ֻ    ״   ט   €p h ,  ; × "Pת7ע:נעL¡iaֻ    ״   ט   €r r ,  ; × "Pת7ע:נעL¡ז‎cֻ    ״   ט   €‏ך	,  ; × "Pת7ע:נעL¡‚eֻ    ״   ט   €‏ך	,  ; × "Pת7ע:נעL¡”נfֻ    ״   ט   €g±ןÚ,  ; × "Pת7ע:נעL¡‚‹iֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡Lיiֻ    ״   ט   €÷›=,  ; × "Pת7ע:נעL¡sjjֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡Gkֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡†ükֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡llֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡'£nֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡-Fqֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡¥§qֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡9rֻ    ״   ט   € ÿ),  ; × "Pת7ע:נעL¡€rֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡=Dsֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡B«sֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡־tֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡¿puֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡"ױvֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡¾˜wֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ֱxֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡M#yֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡p†yֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡Úךyֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡FD{ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡,{ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ו¹~ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ְּֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡2·ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡§ƒֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ֱ…ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡שo…ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡יֻ‡ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡–0ˆֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡pםˆֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡0ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡\ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡יֻֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ד8‘ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡›•‘ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡מ<“ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡h$•ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡%ƒ•ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡¬–ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡שj—ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡¶ִ—ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ף/¡ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡Ý₪ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ײ]¥ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡׳Z§ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡‘U×ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡ֳ­ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡סc¯ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡]ְ±ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡נ
³ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡•Y´ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡_·ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡t¸ֻ    ״   ט   €ßy9†,  ; × "Pת7ע:נעL¡¸ע»ֻ    ״   ט   €עL¡,  ; × "Pת7ע:נעL¡#ם¼ֻ    ״   ט   €עL¡ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ   ״        ֵ¬üֻ    ‹                    ״      8 ¹V÷ÿÿ`÷×V÷ÿÿ,  ; × "Pת7ע:נעL¡סַטÊ    ״   ט   €\ P ,  ; × "Pת7ע:נעL¡ל=יÊ    ״   ט   €2 × ,  ; × "Pת7ע:נעL¡ ,כÊ    ״   ט   €÷r=,  ; × "Pת7ע:נעL¡¨XלÊ    ״   ט   €÷r=,  ; × "Pת7ע:נעL¡{םÊ    ״   ט   €&ש9,  ; × "Pת7ע:נעL¡עÊ    ״   ט   €s " ,  ; × "Pת7ע:נעL¡€׃עÊ    ״   ט   €, " ,  ; × "Pת7ע:נעL¡J÷קÊ    ״   ט   €: t ,  ; × "Pת7ע:נעL¡¥ֻ    ״   ט   €    ,  ; × "Pת7ע:נעL¡1nֻ    ״   ט   €n e ,  ; × "Pת7ע:נעL¡ vֻ    ״   ט   €i o ,  ; × "Pת7ע:נעL¡¦mֻ    ״   ט   €b l ,  ; × "Pת7ע:נעL¡¸›ֻ    ״   ט   €i s ,  ; × "Pת7ע:נעL¡q!ֻ    ״   ט   €s " ,  ; × "Pת7ע:נעL¡½)ֻ    ״   ט   €m P ,  ; × "Pת7ע:נעL¡X8ֻ    ״   ט   €l e ,  ; × "Pת7ע:נעL¡…:ֻ    ״   ט   €d i ,  ; × "Pת7ע:נעL¡Û ?ֻ    ״   ט   €i א¬,  ; × "Pת7ע:נעL¡L@ֻ    ״   ט   €f6 T,  ; × "Pת7ע:נעL¡ֱ¼@ֻ    ״   ט   €װ\,  ; × "Pת7ע:נעL¡״ֽCֻ    ״   ט   € \ P,  ; × "Pת7ע:נעL¡_+Nֻ    ״   ט   € - C,  ; × "Pת7ע:נעL¡\yTֻ    ״   ט   €  p ,  ; × "Pת7ע:נעL¡ךUֻ    ״   ט   €l e ,  ; × "Pת7ע:נעL¡oQVֻ    ״   ט   €d i ,  ; × "Pת7ע:נעL¡׃Xֻ    ״   ט   €s   ,  ; × "Pת7ע:נעL¡0›Xֻ    ״   ט   €r t ,  ; × "Pת7ע:נעL¡jZֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡»Ù_ֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡…aֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡¿zbֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡µeֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡©iֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡״™kֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡zmֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡:׃mֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡;oֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡%pֻ    ״   ט   €ת7,  ; × "Pת7ע:נעL¡"•pֻ   