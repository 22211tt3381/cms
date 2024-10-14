<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', '' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'zzN[:[=?O6D^I(^mrg9zS/2e4p^v9ze1a_eumNEww#gKNf_^mSn-6LecDoAE@u|R' );
define( 'SECURE_AUTH_KEY',  '3B#LS/AZ/2zV/#^<OxgC?MT)o2V6Nd/~GkUkP^]PUM1<),wh-AF(Yr~53HRzgn[ ' );
define( 'LOGGED_IN_KEY',    'h]{ wK1v-%T o n Bb>H{Jv|+T*1*TE<YE+61wdSFX;$c#.h4 #tEE%l>:r$XcfD' );
define( 'NONCE_KEY',        'hzMovPT8j%ZxZ*^H%%Mw>R/r4jjI3<1u>{NS15J8sRZq+oVd6}s9IxIKj`GoD=JV' );
define( 'AUTH_SALT',        'd2##S{tQVfuL}>I0{c+|HffL8$MZ:p;%B#L*RfXk;=Qmi^2.o>Nt|uP$5rG4fZXD' );
define( 'SECURE_AUTH_SALT', 'u6f?!Xtv6lN~Aj.Qpq+*8nb=A e3b]G?K_SjyhOHNxMOT:ql3*dr3b(L`_i/bJRI' );
define( 'LOGGED_IN_SALT',   'n`$):{eCp^FGMDtiFA~SC>KvJ1sK&.E+UbVVb@fn@2h<62-y,dV6jq@7MZB.tufH' );
define( 'NONCE_SALT',       '5S?,9#kfT;(o7.5&4dtp&r+U[:I9=Km7}-3POWu]~^{GZCV!ljZNXsKNissgw}P ' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
