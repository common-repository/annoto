jQuery( function ( $ ) {

    var getSettingsDeferred = $.Deferred();

    $.post(
        '',
        {
            action: 'get-settings',
            data: {}
        }
    ).done(function(serverResponse) {
        var response = JSON.parse(serverResponse);

        if (response.status === 'success') {
            getSettingsDeferred.resolve(response.data);
        } else {
            getSettingsDeferred.reject('WP Server: Fetching of the Annoto settings has failed!');
        }
    });

    $.when( getSettingsDeferred )
        .then(
            function( data ) {
                var playerId = '';

                $('body iframe').each(function () {
                    if ( this.src.indexOf( data[ 'player-type' ] ) !== -1 && typeof this.id !== 'undefined' ) {
                        playerId = this.id;
                        return false;
                    }

                    return true;
                });

                return {
                    playerId: playerId,
                    settings: data
                };
            },
            function ( errText ){
                console && console.error( errText );
            })
        .then(
            function ( configData ) {

                if ( !configData ) {
                    console && console.error('Annoto Plugin: settings missing.');
                    return;
                }

                if ( configData.playerId.length === 0 ) {
                    console && console.error('Annoto Plugin: Can\'t determine the player ID.');
                    return;
                }

                if ( !configData.settings['demo-mode'] && configData.settings['api-key'].length === 0 ) {
                    console && console.error(
                        'Annoto Plugin: Plugin isn\'t in the Demo Mode, please, set the SSO Secret.'
                    );
                    return;
                }

                if (configData.settings['demo-mode']) {
                    console && console.warn('Annoto Plugin: Plugin boot in the Demo Mode.');
                }

                $( '#' + configData.playerId ).after('<div id="annoto-app"></div>');

                var config = {
                    clientId: configData.settings[ 'api-key' ],
                    position: configData.settings[ 'widget-position' ],

                    widgets: [
                        {
                            player: {
                                type: configData.settings[ 'player-type' ],
                                element: configData.playerId,
                            },
                            timeline: {
                                embedded: false,
                                overlayVideo : Boolean( configData.settings[ 'annoto-timeline-overlay-switch' ] )
                            }
                        }
                    ],
                    simple: true,
                    rtl: Boolean( configData.settings[ 'rtl-support' ] ),
                    demoMode: Boolean( configData.settings[ 'demo-mode' ] )
                };

                if(configData.settings[ 'annoto-advanced-settings-switch' ])
                {
                    config.align = {
                        vertical: configData.settings[ 'widget-align-vertical' ],
                        horizontal: configData.settings[ 'widget-align-horizontal' ]
                    };
                    config.width = { max: configData.settings[ 'widget-max-width' ] };
                }

				if(configData.settings[ 'annoto-features-settings-switch' ])
                {
                    config.features = {
                        tabs: Boolean( configData.settings[ 'widget-features-tabs' ] ),
                        userPreferences: Boolean( configData.settings[ 'widget-features-userPreferences' ] )
                    };
                }
                if(configData.settings[ 'player-type' ] === 'vimeo')
                {
                    config.widgets[0].player.params=configData.settings[ 'annoto-player-params' ];
                }


                if ( ! window.Annoto ) {
                    console && console.error( 'Annoto: not loaded' );
                    return;
                }

                window.Annoto.on( 'ready', function ( api ) {
                    if ( configData.settings['token'].length > 0 ) {
                        api.auth( configData.settings['token'], function ( annotoAuthError ) {
                            if ( annotoAuthError ) {
                                console && console.error( annotoAuthError );
                            }
                        } );
                    }
                } );
                window.Annoto.boot( config );
            });
});
