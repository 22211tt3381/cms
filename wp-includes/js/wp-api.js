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
		 * ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
		 * before falling back to any implementation-specific date parsing, so that’s what we do, even if native
		 * implementations could be faster.
		 */
		//              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
		if ( ( struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec( date ) ) ) {

			// Avoid NaN timestamps caused by “undefined” values being passed to Date.UTC.
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

				// If we didn’t have embedded getObjects, fetch the getObjects data.
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
							return beforeSend.apply( se   �        g���    �                    �      `��V���8�W���,  �; � "P�7�:��L�=��    �   �   �W �,  �; � "P�7�:��L����    �   �   �, � ,  �; � "P�7�:��L�����    �   �   ��U�<,  �; � "P�7�:��L�&���    �   �   ����,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�%��    �   �   ��  ,  �; � "P�7�:��L��]��    �   �   ��  ,  �; � "P�7�:��L�F/��    �   �   ��  ,  �; � "P�7�:��L����    �   �   �2   ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�<P��    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�n��    �   �   ��  ,  �; � "P�7�:��L���V�    �   �   ��  ,  �; � "P�7�:��L�U_Z�    �   �   ��  ,  �; � "P�7�:��L��\�    �   �   ��  ,  �; � "P�7�:��L�΍_�    �   �   ��  ,  �; � "P�7�:��L�� `�    �   �   ��  ,  �; � "P�7�:��L���c�    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�ƥ��    �   �   ��  ,  �; � "P�7�:��L�$���    �   �   ��  ,  �; � "P�7�:��L�9<��    �   �   ��  ,  �; � "P�7�:��L��ܥ�    �   �   ��  ,  �; � "P�7�:��L���    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�!��    �   �   ��  ,  �; � "P�7�:��L�,���    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�Y��    �   �   ��  ,  �; � "P�7�:��L�@� �    �   �   ��  ,  �; � "P�7�:��L���"�    �   �   ��  ,  �; � "P�7�:��L���$�    �   �   ��  ,  �; � "P�7�:��L�=%�    �   �   ��  ,  �; � "P�7�:��L�p&�    �   �   ��  ,  �; � "P�7�:��L�v&�    �   �   ��  ,  �; � "P�7�:��L���&�    �   �   ��  ,  �; � "P�7�:��L�#9'�    �   �   ��  ,  �; � "P�7�:��L�̮/�    �   �   ��  ,  �; � "P�7�:��L�sH2�    �   �   ��  ,  �; � "P�7�:��L��=4�    �   �   ��  ,  �; � "P�7�:��L���4�    �   �   ��  ,  �; � "P�7�:��L��5�    �   �   ��  ,  �; � "P�7�:��L�nk6�    �   �   ��  ,  �; � "P�7�:��L��<�    �   �   ��  ,  �; � "P�7�:��L��5Z�    �   �   ��  ,  �; � "P�7�:��L�;�[�    �   �   ��  ,  �; � "P�7�:��L�Vc�    �   �   ��  ,  �; � "P�7�:��L��d�    �   �   ��  ,  �; � "P�7�:��L���d�    �   �   ��  ,  �; � "P�7�:��L�}p�    �   �   ��  ,  �; � "P�7�:��L���    �   �   ��  ,  �; � "P�7�:��L��	��    �   �   ��  ,  �; � "P�7�:��L�I��    �   �   ��  ,  �; � "P�7�:��L�ڏ�    �   �   ��  ,  �; � "P�7�:��L�*v��    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L��J��    �   �   ��  ,  �; � "P�7�:��L�И�    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�m���    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�Ԭ��    �   �   ��  ,  �; � "P�7�:��L�L'��    �   �   ��  ,  �; � "P�7�:��L�ѫ��    �   �   ��  ,  �; � "P�7�:��L��ռ�    �   �   ��  ,  �; � "P�7�:��L��"��    �   �   ��  ,  �; � "P�7�:��L�Ig��    �   �   ��  ,  �; � "P�7�:��L��n��    �   �   ��  ,  �; � "P�7�:��L�8���    �   �   ��  ,  �; � "P�7�:��L�+a��    �   �   ��  ,  �; � "P�7�:��L�U���    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L��W��    �   �   ��  ,  �; � "P�7�:��L��-��    �   �   ��  ,  �; � "P�7�:��L�8���    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�A���    �   �   ��  ,  �; � "P�7�:��L��}��    �   �   ��  ,  �; � "P�7�:��L��c��    �   �   ��  ����������������������������������������   �        2$�    �                     �      8�V���8��V���,  �; � "P�7�:��L�����    �   �   � � ,  �; � "P�7�:��L�s���    �   �   �E \ ,  �; � "P�7�:��L�M*��    �   �   �o s ,  �; � "P�7�:��L�M��    �   �   �a r ,  �; � "P�7�:��L�R��    �   �   � � ,  �; � "P�7�:��L��W��    �   �   � � ,  �; � "P�7�:��L��ղ�    �   �   �8�,<,  �; � "P�7�:��L�'ӳ�    �   �   �h2,  �; � "P�7�:��L� ���    �   �   �h2,  �; � "P�7�:��L����    �   �   ���H2,  �; � "P�7�:��L�4���    �   �   �    ,  �; � "P�7�:��L��k��    �   �   ��  ,  �; � "P�7�:��L�ֽ�    �   �   ��  ,  �; � "P�7�:��L��۾�    �   �   �   ,  �; � "P�7�:��L�Q&��    �   �   �!  ,  �; � "P�7�:��L�B���    �   �   �!  ,  �; � "P�7�:��L�X���    �   �   �!  ,  �; � "P�7�:��L��_��    �   �   ��  ,  �; � "P�7�:��L�p���    �   �   �&*�,  �; � "P�7�:��L�Z���    �   �   � � ,  �; � "P�7�:��L�\W��    �   �   �   ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�2���    �   �   �&*�,  �; � "P�7�:��L�ƽ��    �   �   � � ,  �; � "P�7�:��L�¦��    �   �   �   ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L��2��    �   �   �&*�,  �; � "P�7�:��L����    �   �   �& � ,  �; � "P�7�:��L����    �   �   ��$ 4,  �; � "P�7�:��L��b��    �   �   �&*�,  �; � "P�7�:��L�m��    �   �   � � ,  �; � "P�7�:��L�0���    �   �   �    ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ���,  �; � "P�7�:��L�.u��    �   �   �s k ,  �; � "P�7�:��L�`���    �   �   ���	,  �; � "P�7�:��L����    �   �   �,�_,  �; � "P�7�:��L��8��    �   �   ���,  �; � "P�7�:��L�ן��    �   �   �s k ,  �; � "P�7�:��L�ۇ��    �   �   �,�_,  �; � "P�7�:��L����    �   �   �7N(,  �; � "P�7�:��L�
��    �   �   �4 . ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L��?��    �   �   �&*�,  �; � "P�7�:��L��o��    �   �   � � ,  �; � "P�7�:��L��2��    �   �   ��   ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�����    �   �   �&*�,  �; � "P�7�:��L�fy��    �   �   � � ,  �; � "P�7�:��L�Ma��    �   �   ��   ,  �; � "P�7�:��L�	��    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L�))��    �   �   ��  ,  �; � "P�7�:��L�ӟ��    �   �   ��  ,  �; � "P�7�:��L�����    �   �   ��  ,  �; � "P�7�:��L�Ho �    �   �   �   ,  �; � "P�7�:��L���    �   �   �& � ,  �; � "P�7�:��L��    �   �   ��7,  �; � "P�7�:��L�L	�    �   �   ��U�<,  �; � "P�7�:��L���    �   �   ��7,  �; � "P�7�:��L��    �   �   �I�<,  �; � "P�7�:��L����    �   �   �r d ,  �; � "P�7�:��L�TP	�    �   �   ���9=,  �; � "P�7�:��L��	�    �   �   �JBB:,  �; � "P�7�:��L���
�    �   �   �JBB:,  �; � "P�7�:��L��3�    �   �   ��7,  �; � "P�7�:��L����    �   �   ��7,  �; � "P�7�:��L��H�    �   �   ��7,  �; � "P�7�:��L����    �   �   ��7,  �; � "P�7�:��L���    �   �   ��7,  �; � "P�7�:��L����    �   �   ��7,  �; � "P�7�:��L�P�    �   �   ��U�<,  �; � "P�7�:��L���    �   �   �JBB:,  �; � "P�7�:��L����    �   �   �JBB:,  �; � "P�7�:��L����    �   �   �JBB:,  �; � "P�7�:��L�D9�    �   �   �JBB:,  �; � "P�7�:��L�y��    �   �   �JBB:,  �; � "P�7�:��L����    �   �   �JBB:,  �; � "P�7�:��L����    �   �   �.=,  �; � "P�7�:��L�_��    �   �   ��~�4,  �; � "P�7�:��L�A�    �   �   �b 2 ,  �; � "P�7�:��L�ޣ�    �   �   �. e ����������������������������������������   �        �:w�    �                    �      8�W���8��V���,  �; � "P�7�:��L�lڮ�    �   �   �Cb�/,  �; � "P�7�:��L�E��    �   �   �    ,  �; � "P�7�:��L��\��    �   �   ��0,  �; � "P�7�:��L����    �   �   ���7,  �; � "P�7�:��L�6�    �   �   �Cb�/,  �; � "P�7�:��L�ڠ-�    �   �   �    ,  �; � "P�7�:��L���.�    �   �   �J�9,  �; � "P�7�:��L�8A/�    �   �   ��0,  �; � "P�7�:��L�)�2�    �   �   ��,  �; � "P�7�:��L�qx3�    �   �   �Cb�/,  �; � "P�7�:��L�$�9�    �   �   �    ,  �; � "P�7�:��L�<;�    �   �   ��0,  �; � "P�7�:��L�f�>�    �   �   �    ,  �; � "P�7�:��L��fU�    �   �   ��t2,  �; � "P�7�:��L�Ǆ\�    �   �   �    ,  �; � "P�7�:��L���]�    �   �   ��0,  �; � "P�7�:��L���p�    �   �   �    ,  �; � "P�7�:��L�_cq�    �   �   ��t2,  �; � "P�7�:��L��x�    �   �   �    ,  �; � "P�7�:��L���z�    �   �   �    ,  �; � "P�7�:��L�?%��    �   �   �r o ,  �; � "P�7�:��L����    �   �   �    ,  �; � "P�7�:��L�e��    �   �   �W   ,  �; � "P�7�:��L�7֕�    �   �   �W   ,  �; � "P�7�:��L�>���    �   �   �S�Z<,  �; � "P�7�:��L��I��    �   �   �    ,  �; � "P�7�:��L�R��    �   �   ��0,  �; � "P�7�:��L�Z���    �   �   �^�=,  �; � "P�7�:��L���    �   �   �S�Z<,  �; � "P�7�:��L��A��    �   �   �    ,  �; � "P�7�:��L��r��    �   �   ��0,  �; � "P�7�:��L�פ��    �   �   ��  ,  �; � "P�7�:��L����    �   �   �, � ,  �; � "P�7�:��L�U.��    �   �   �
 � ,  �; � "P�7�:��L�~.��    �   �   �erM0,  �; � "P�7�:��L�����    �   �   �erM0,  �; � "P�7�:��L����    �   �   �erM0,  �; � "P�7�:��L��"��    �   �   �erM0,  �; � "P�7�:��L�����    �   �   �erM0,  �; � "P�7�:��L�o���    �   �   �|��3,  �; � "P�7�:��L�_���    �   �   �; � ,  �; � "P�7�:��L�'p��    �   �   �; � ,  �; � "P�7�:��L�U���    �   �   �; � ,  �; � "P�7�:��L�C��    �   �   �; � ,  �; � "P�7�:��L�ud��    �   �   �; � ,  �; � "P�7�:��L�����    �   �   �; � ,  �; � "P�7�:��L�Zd��    �   �   �; � ,  �; � "P�7�:��L�K���    �   �   �; � ,  �; � "P�7�:��L����    �   �   �; � ,  �; � "P�7�:��L��&��    �   �   �& � ,  �; � "P�7�:��L��1��    �   �   ��r=,  �; � "P�7�:��L�w���    �   �   �Kz6,  �; � "P�7�:��L�N� �    �   �   ��7,  �; � "P�7�:��L��'�    �   �   ��7,  �; � "P�7�:��L���    �   �   ��7,  �; � "P�7�:��L�\X�    �   �   ��$ 4,  �; � "P�7�:��L����    �   �   �jSP�,  �; � "P�7�:��L�j��    �   �   �    ,  �; � "P�7�:��L�
�    �   �   ��  ,  �; � "P�7�:��L�e
�    �   �   ��  ,  �; � "P�7�:��L����    �   �   ��  ,  �; � "P�7�:��L���    �   �   ��  ,  �; � "P�7�:��L�Ǖ�    �   �   �c t ,  �; � "P�7�:��L�d�    �   �   �; � ,  �; � "P�7�:��L����    �   �   �; � ,  �; � "P�7�:��L����    �   �   �; � ,  �; � "P�7�:��L�%��    �   �   �; � ,  �; � "P�7�:��L�03�    �   �   �
 � ,  �; � "P�7�:��L�\�4�    �   �   �In�0,  �; � "P�7�:��L���5�    �   �   �In�0,  �; � "P�7�:��L��<�    �   �   ��7,  �; � "P�7�:��L��<�    �   �   ���4,  �; � "P�7�:��L��:A�    �   �   �M a ,  �; � "P�7�:��L��GD�    �   �   �r t ,  �; � "P�7�:��L���E�    �   �   �    ,  �; � "P�7�:��L�%�I�    �   �   �    ,  �; � "P�7�:��L��M�    �   �   �    ,  �; � "P�7�:��L��oS�    �   �   �    ,  �; � "P�7�:��L��V�    �   �   �����,  �; � "P�7�:��L���[�    �   �   �����,  �; � "P�7�:��L��S_�    �   �   �����,  �; � "P�7�:��L�m�a�    �   �   �����,  �; � "P�7�:��L�ϣo�    �   �   ���������������������������������������������   �        1��    �                     �      80oV���8�V���,  �; � "P�7�:��L�2$�    �   �   �`)  ,  �; � "P�7�:��L�T�$�    �   �   �l u ,  �; � "P�7�:��L��.�    �   �   �m d ,  �; � "P�7�:��L�O�2�    �   �   �t i ,  �; � "P�7�:��L���3�    �   �   �d m ,  �; � "P�7�:��L�)I4�    �   �   �a l ,  �; � "P�7�:��L��)6�    �   �   �t   ,  �; � "P�7�:��L���6�    �   �   �   ,  �; � "P�7�:��L��7�    �   �   �s i ,  �; � "P�7�:��L��;�    �   �   �    ,  �; � "P�7�:��L��W>�    �   �   �4!  ,  �; � "P�7�:��L��{H�    �   �   �l u ,  �; � "P�7�:��L���J�    �   �   �m d ,  �; � "P�7�:��L�GFK�    �   �   �m 3 ,  �; � "P�7�:��L�}>W�    �   �   �h p ,  �; � "P�7�:��L�lMY�    �   �   �\ p ,  �; � "P�7�:��L�$�Y�    �   �   �r o ,  �; � "P�7�:��L�0�\�    �   �   �E _ ,  �; � "P�7�:��L���]�    �   �   �_ e ,  �; � "P�7�:��L���^�    �   �   �t a ,  �; � "P�7�:��L�n`�    �   �   �p h ,  �; � "P�7�:��L�ia�    �   �   �r r ,  �; � "P�7�:��L���c�    �   �   ���	,  �; � "P�7�:��L���e�    �   �   ���	,  �; � "P�7�:��L���f�    �   �   �g���,  �; � "P�7�:��L���i�    �   �   ��L�,  �; � "P�7�:��L�L�i�    �   �   ���=,  �; � "P�7�:��L�sjj�    �   �   � �)�,  �; � "P�7�:��L�Gk�    �   �   � �)�,  �; � "P�7�:��L���k�    �   �   � �)�,  �; � "P�7�:��L��ll�    �   �   � �)�,  �; � "P�7�:��L�'�n�    �   �   � �)�,  �; � "P�7�:��L�-Fq�    �   �   � �)�,  �; � "P�7�:��L���q�    �   �   � �)�,  �; � "P�7�:��L�9r�    �   �   � �)�,  �; � "P�7�:��L��r�    �   �   ��L�,  �; � "P�7�:��L�=Ds�    �   �   ��L�,  �; � "P�7�:��L�B�s�    �   �   ��L�,  �; � "P�7�:��L�Ύt�    �   �   ��L�,  �; � "P�7�:��L��pu�    �   �   ��L�,  �; � "P�7�:��L�"�v�    �   �   ��L�,  �; � "P�7�:��L���w�    �   �   ��L�,  �; � "P�7�:��L��x�    �   �   ��L�,  �; � "P�7�:��L�M#y�    �   �   ��L�,  �; � "P�7�:��L�p�y�    �   �   ��L�,  �; � "P�7�:��L���y�    �   �   ��L�,  �; � "P�7�:��L�FD{�    �   �   ��L�,  �; � "P�7�:��L�,�{�    �   �   ��L�,  �; � "P�7�:��L��~�    �   �   ��L�,  �; � "P�7�:��L��    �   �   ��L�,  �; � "P�7�:��L����    �   �   ��L�,  �; � "P�7�:��L�2���    �   �   ��L�,  �; � "P�7�:��L�����    �   �   ��L�,  �; � "P�7�:��L����    �   �   ��L�,  �; � "P�7�:��L��o��    �   �   ��L�,  �; � "P�7�:��L��ˇ�    �   �   ��L�,  �; � "P�7�:��L��0��    �   �   ��L�,  �; � "P�7�:��L�p��    �   �   ��L�,  �; � "P�7�:��L�0��    �   �   ��L�,  �; � "P�7�:��L�\��    �   �   ��L�,  �; � "P�7�:��L��ˎ�    �   �   ��L�,  �; � "P�7�:��L��8��    �   �   ��L�,  �; � "P�7�:��L�����    �   �   ��L�,  �; � "P�7�:��L��<��    �   �   ��L�,  �; � "P�7�:��L�h$��    �   �   ��L�,  �; � "P�7�:��L�%���    �   �   ��L�,  �; � "P�7�:��L����    �   �   ��L�,  �; � "P�7�:��L��j��    �   �   ��L�,  �; � "P�7�:��L��ė�    �   �   ��L�,  �; � "P�7�:��L��/��    �   �   ��L�,  �; � "P�7�:��L����    �   �   ��L�,  �; � "P�7�:��L��]��    �   �   ��L�,  �; � "P�7�:��L��Z��    �   �   ��L�,  �; � "P�7�:��L��U��    �   �   ��L�,  �; � "P�7�:��L�í�    �   �   ��L�,  �; � "P�7�:��L��c��    �   �   ��L�,  �; � "P�7�:��L�]���    �   �   ��L�,  �; � "P�7�:��L��
��    �   �   ��L�,  �; � "P�7�:��L��Y��    �   �   ��L�,  �; � "P�7�:��L��_��    �   �   ��L�,  �; � "P�7�:��L�t��    �   �   ��y9�,  �; � "P�7�:��L����    �   �   ��L�,  �; � "P�7�:��L�#��    �   �   ��L�����������������������������������������   �        Ŭ��    �                    �      8��V���`��V���,  �; � "P�7�:��L�����    �   �   �\ P ,  �; � "P�7�:��L��=��    �   �   �2 � ,  �; � "P�7�:��L��,��    �   �   ��r=,  �; � "P�7�:��L��X��    �   �   ��r=,  �; � "P�7�:��L�{��    �   �   �&�9,  �; � "P�7�:��L���    �   �   �s " ,  �; � "P�7�:��L�����    �   �   �, " ,  �; � "P�7�:��L�J���    �   �   �: t ,  �; � "P�7�:��L���    �   �   �    ,  �; � "P�7�:��L�1n�    �   �   �n e ,  �; � "P�7�:��L� v�    �   �   �i o ,  �; � "P�7�:��L��m�    �   �   �b l ,  �; � "P�7�:��L����    �   �   �i s ,  �; � "P�7�:��L��q!�    �   �   �s " ,  �; � "P�7�:��L���)�    �   �   �m P ,  �; � "P�7�:��L��X8�    �   �   �l e ,  �; � "P�7�:��L���:�    �   �   �d i ,  �; � "P�7�:��L�۠?�    �   �   �i �,  �; � "P�7�:��L�L@�    �   �   �f6 T,  �; � "P�7�:��L���@�    �   �   ��\,  �; � "P�7�:��L���C�    �   �   � \ P,  �; � "P�7�:��L�_+N�    �   �   � - C,  �; � "P�7�:��L�\yT�    �   �   �  p ,  �; � "P�7�:��L��U�    �   �   �l e ,  �; � "P�7�:��L�oQV�    �   �   �d i ,  �; � "P�7�:��L��X�    �   �   �s   ,  �; � "P�7�:��L�0�X�    �   �   �r t ,  �; � "P�7�:��L��jZ�    �   �   ��7,  �; � "P�7�:��L���_�    �   �   ��7,  �; � "P�7�:��L��a�    �   �   ��7,  �; � "P�7�:��L��zb�    �   �   ��7,  �; � "P�7�:��L��e�    �   �   ��7,  �; � "P�7�:��L��i�    �   �   ��7,  �; � "P�7�:��L�ؙk�    �   �   ��7,  �; � "P�7�:��L�zm�    �   �   ��7,  �; � "P�7�:��L�:�m�    �   �   ��7,  �; � "P�7�:��L�;o�    �   �   ��7,  �; � "P�7�:��L��%p�    �   �   ��7,  �; � "P�7�:��L�"�p�   