<?php
/*
Plugin Name: Annoto
Plugin URI:  https://www.annoto.net/
Description: WP plugin for Annoto
Version:     1.0
Author:      Annoto Team
Author URI:  https://www.annoto.net/
Text Domain: annoto
License:     GPLv3

Annoto Plugin is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

Annoto Plugin is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Annoto Plugin. If not, see https://www.gnu.org/licenses/quick-guide-gplv3.html.
*/

/** ANNOTO_VERSION version - of the Annoto plugin */
define( 'ANNOTO_VERSION', '1.0' );

/** ANNOTO_MINIMUM_WP_VERSION - minimum required version of the WordPress */
define( 'ANNOTO_MINIMUM_WP_VERSION', '4.7' );

/** ANNOTO_PLUGIN_DIR */
define( 'ANNOTO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

/** ANNOTO_PLUGIN_URL */
define( 'ANNOTO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/** ANNOTO_SETTING_KEY_NAME - name of the key of the plugin settings in DB */
define( 'ANNOTO_SETTING_KEY_NAME', 'annoto_settings' );

require_once( ANNOTO_PLUGIN_DIR . 'class.annoto.php' );

register_activation_hook( __FILE__, array( 'Annoto', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Annoto', 'plugin_deactivation' ) );

if ( is_admin() ) {
    require_once( ANNOTO_PLUGIN_DIR . 'class.annoto-admin.php' );
    add_action( 'init', [ 'AnnotoAdmin', 'init' ] );
} else {
    add_action( 'init', [ 'Annoto', 'init' ] );
}










