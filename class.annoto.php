<?php

require_once ('class.jwt.php');

/**
 * Class Annoto
 */
class Annoto {

    /** @var bool $initiated */
    private static $initiated = false;

    /** @var WP_User|null $currentUserIdentity */
    private static $currentUserIdentity = null;

    /** @var array $defaultSettingValues */
    private static $defaultSettingValues = [
        'sso-support' => 0,
        'demo-mode' =>  1,
		'annoto-advanced-settings-switch' => 0,
		'annoto-timeline-overlay-switch' => 0,
        'widget-position' => 'right',
        'rtl-support' => 0,
        'player-type' => 'youtube',
		'annoto-vimeo-premium-player' => 0,
        'sso-secret' => '',
        'api-key' => '',
		'widget-max-width' =>	'300',
		'widget-align-vertical' => 'center',
		'widget-align-horizontal' => 'center',
		'annoto-player-params' => '{}'
    ];

    /**
     * Init method will initiate all hooks and handle ajax to return settings
     */
    public static function init()
    {
        if ( ! static::$initiated ) {
            static::init_hooks();
        }

        $post = $_POST;

        if (
            array_key_exists('action', $post)
            && $post['action'] === 'get-settings'
        ) {
            static::getConfigData();
        }
    }

    /**
     * All hooks to initialize
     */
    public static function init_hooks()
    {
        static::$initiated = true;

        static::loadResources();

        add_action( 'wp_loaded', static::setCurrentUser() );
        add_filter('embed_oembed_html', [ 'Annoto', 'prepareVideoIFrameAttributes' ], 10, 3);
    }

    /**
     * Load all sources
     */
    public static function loadResources()
    {
        wp_register_script(
            'annoto-bootstrap.js',
            'https://app.annoto.net/annoto-bootstrap.js',
            [],
            ANNOTO_VERSION
        );
        wp_enqueue_script( 'annoto-bootstrap.js' );

        wp_register_script(
            'annoto.js',
            plugin_dir_url( __FILE__ ) . 'src/js/annoto.js',
            [ 'jquery' ],
            ANNOTO_VERSION
        );
        wp_enqueue_script( 'annoto.js' );
    }

    /**
     * Setter to store current user to class property
     */
    public static function setCurrentUser()
    {
        $currentUser = wp_get_current_user();

        if ( $currentUser instanceof WP_User ) {
            static::$currentUserIdentity = $currentUser;
        }
    }

    /**
     * Handle the AJAX and incapsulate business-logic according to retrieving correct config values
     */
    public static function getConfigData()
    {
        $post = $_POST;

        if (
            array_key_exists('action', $post)
            && $post['action'] === 'get-settings'
        ) {
            $pluginSettings = get_option('annoto_settings');

            if (!$pluginSettings) {
                echo json_encode(['status' => 'failed']);
                exit();
            }

            if ( ! $pluginSettings['sso-support'] ) {
                $pluginSettings['sso-secret'] = '';
            }

            $pluginSettings['token'] = '';

            if (
                ! $pluginSettings['demo-mode']
                && $pluginSettings['sso-support']
                && is_user_logged_in()
            ) {
                $pluginSettings['token'] = static::generateToken($pluginSettings);
            }

            unset($pluginSettings['sso-secret']);

            echo json_encode([
                'status' => 'success',
                'data' => $pluginSettings
            ]);
            exit();
        }
    }

    /**
     * Make IFrames compatible with Annoto API
     *
     * @param string $html
     * @param string $url
     * @param array $attr
     *
     * @return string
     */
    public static function prepareVideoIFrameAttributes( $html, $url, $attr )
    {
        if ( empty( $attr['id'] ) ) {
            $uniqueId = uniqid('annoto_', true);
            $html = str_replace( '<iframe', sprintf( '<iframe id="%s"', $uniqueId ), $html );
        }

        if ( strpos( $html, 'youtube' ) && !strpos( $html, 'enablejsapi=1' ) ) {
            $html = str_replace( 'feature=oembed', 'feature=oembed&enablejsapi=1', $html );
        }

        return $html;
    }

    /**
     * Render view by name
     *
     * @param string $name
     */
    public static function view( $name ) {

        $file = ANNOTO_PLUGIN_DIR . 'views/'. $name . '.php';

        include( $file );
    }

    /**
     * Plugin activation handler
     */
    public static function plugin_activation() {
        if ( static::checkCurrentVersionCorresponding() ) {
            static::showUpdateMessageInfo();

            return;
        }

        if ( !static::setDefaultSettingsValuesForPlugin() ) {
            static::showSettingFailsInfo();

            return;
        }
    }

    /**
     * Plugin deactivation handler
     */
    public static function plugin_deactivation( ) {
        return delete_option( ANNOTO_SETTING_KEY_NAME );
    }

    /**
     * Set default setting values for plugin
     *
     * @return bool
     */
    private static function setDefaultSettingsValuesForPlugin()
    {
        return add_option( ANNOTO_SETTING_KEY_NAME, static::$defaultSettingValues, 'no' );
    }

    /**
     * Check is current version of Annoto plugin corresponding to WP version
     *
     * @return mixed
     */
    private static function checkCurrentVersionCorresponding()
    {
        return version_compare( $GLOBALS['wp_version'], ANNOTO_MINIMUM_WP_VERSION, '<' );
    }

    /**
     * Show setting fails info
     */
    private static function showSettingFailsInfo()
    {
        $message = '<strong>' . __('Can\'t set default values for Annoto plugin.', 'annoto') . '</strong>';

        static::showMessageTemplate( $message );
    }

    /**
     * Show update message info
     */
    private static function showUpdateMessageInfo()
    {
        $message = '<strong>'
            . sprintf(
                esc_html__( 'Annoto %s requires WordPress %s or higher.' , 'annoto'),
                ANNOTO_VERSION,
                ANNOTO_MINIMUM_WP_VERSION
            )
            . '</strong> '
            . sprintf(
                __('Please <a href="%1$s">upgrade WordPress</a> to a current version.', 'annoto'),
                'https://codex.wordpress.org/Upgrading_WordPress'
            );

        static::showMessageTemplate( $message );
    }

    /**
     * Generate JWT Token
     *
     * @param array $pluginSettings
     *
     * @return string
     */
    private static function generateToken(array $pluginSettings)
    {
        $issuedAt = time();
        $expire = $issuedAt + 60*60;

        $payload = [
            'iss' => $pluginSettings['api-key'],
            'exp' => $expire,
            'jti' => static::$currentUserIdentity->ID,
            'name' => static::$currentUserIdentity->display_name,
            'email' => static::$currentUserIdentity->user_email,
            'photoUrl' => get_avatar_url(static::$currentUserIdentity->ID),
        ];

        return JWT::encode($payload, $pluginSettings['sso-secret']);
    }

    /**
     * Show message template
     *
     * @param string $message
     */
    private static function showMessageTemplate( $message ) {
        ?>
        <!doctype html>
        <html>
        <head>
            <meta charset="<?php bloginfo( 'charset' ); ?>">
            <style>
                * {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    font-family: "Lucida Grande",Verdana,Arial,"Bitstream Vera Sans",sans-serif;
                }
                p {
                    margin-top: 1em;
                    font-size: 18px;
                }
            </style>
        <body>
        <p><?php echo $message; ?></p>
        </body>
        </html>
        <?php
        exit();
    }
}
