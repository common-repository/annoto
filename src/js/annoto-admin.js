jQuery(document).ready( function ( $ ) {

    var nameToOutputTextMapper = {
        mappingData: {
            'widget-position': {
                right: 'Right',
                bottom: 'Bottom',
                left: 'Left'
            },
            'player-type': {
                youtube: 'YouTube',
                vimeo: 'Vimeo'
            },
            'rtl-support': {
                0: 'En',
                1: 'He'
            },
            'widget-align-vertical': {
                center: 'Center',
                bottom: 'Bottom',
                top : 'Top'
            },
            'widget-align-horizontal': {
                screen_edge : 'Edge of Screen',
                element_edge: 'Edge of Player'
            }
        },
        getOutputText: function(fieldName, valueName) {
            return this.mappingData[fieldName][valueName];
        }
    };

    var toggleDisabledInputs = {
        ssoSupport: function () {
            var ssoSecretInput = $( '#sso-secret' );
            this.isSsoSecretEnabled() ? ssoSecretInput.prop( 'disabled', false ) : ssoSecretInput.prop( 'disabled', true );
        },
        ssoSecret: function () {
            var apiKeyInput = $( '#api-key' ),
                ssoSecretInput = $( '#sso-secret' );

            $( '#demo-mode' )[0].checked ? apiKeyInput.prop( 'disabled', true ) : apiKeyInput.prop( 'disabled', false );
            this.isSsoSecretEnabled() ? ssoSecretInput.prop( 'disabled', false ) : ssoSecretInput.prop( 'disabled', true );
        },
        isSsoSecretEnabled: function () {
            return false === $( '#demo-mode' )[0].checked && $( '#sso-support' )[0].checked;
        },
        advancedSettingsSupport : function () {
            this.isAdvancedSettingsEnabled() ? this.toggleAdvancedSettingsContainer(true) : this.toggleAdvancedSettingsContainer(false);
        },
		featuresSettingsSupport : function () {
            this.isFeaturesSettingsEnabled() ? this.toggleFeaturesSettingsContainer(true) : this.toggleFeaturesSettingsContainer(false);
        },								 																																	
        isAdvancedSettingsEnabled : function () {
            return $( '#annoto-advanced-settings-switch' )[0].checked;
        },
		isFeaturesSettingsEnabled : function () {
            return $( '#annoto-features-settings-switch' )[0].checked;
        },										   
        toggleAdvancedSettingsContainer: function (onOff) {
            $( '.annoto-advanced-settings-container' ).toggle(onOff);
        },
		toggleFeaturesSettingsContainer: function (onOff) {
            $( '.annoto-features-settings-container' ).toggle(onOff);
        },													  
        togglePlayerSettings: function () {
            var playerType = $( '#player-type-value' ).val();
            $( '.annoto-player-params' ).hide();

            if ( playerType === 'vimeo' ) {
                $( '.annoto-player-params' ).show();
            }
        },
        all: function () {
            this.ssoSupport();
            this.ssoSecret();
            this.advancedSettingsSupport();
			this.featuresSettingsSupport();					   
            this.togglePlayerSettings();
        }
    };

    var settingsFromServer = JSON.parse( $( '#settingsFromServer' ).val());

    var settingForm = {
        formId: '#settingForm',
        gatheredData: function () {
            var settingData = {};
            settingData[ 'annoto-player-params' ] = {};

            $( this.formId ).find( 'input.setting-data' ).each( function () {

                switch ( $( this ).data( 'type' ) ) {
                    case 'number':
                        settingData[ this.name ] = Number( $( this ).val() );
                        break;
                    default:
                        settingData[ this.name ] = $( this ).val();
                        break;
                }

                if ( this.type === 'checkbox' ) {
                    settingData[ this.name] = Number($(this)[0].checked);
                    if ($( this ).data('player-params')) {
                        settingData[ 'annoto-player-params' ][ JSON.stringify(($( this ).data('player-params').name)) ] = Boolean(settingData[ this.name ]).toString();
                    }
                } else {
                    if ($( this ).data('player-params')) {
                        settingData[ 'annoto-player-params' ][ $( this ).data('player-params').name ] = settingData[ this.name ];
                    }
                }



            });

            return settingData;
        },
        isDataChanged: function () {
            return JSON.stringify(this.gatheredData()) !== JSON.stringify(settingsFromServer);
        },
        isValid: function () {
            var ssoSecreteField = $('input#sso-secret');
            var apiKeyField = $('input#api-key');

            if ( ! ssoSecreteField.prop( 'disabled' ) && ! this.isSSOSecretValid( ssoSecreteField.val() ) ) {
                return this.showValidationError( ssoSecreteField );
            }

            if ( ! apiKeyField.prop( 'disabled' ) && ! this.isJWTStringValid( apiKeyField.val() ) ) {
                return this.showValidationError( apiKeyField );
            }

            return true;
        },
        isJWTStringValid: function ( input ) {
            var segments = input.split('.');
            var validBase64RegExp = new RegExp('^[A-Za-z0-9+-_/=]*$');

            return segments.length === 3
                && Boolean ( validBase64RegExp.test( segments[0] ) )
                && Boolean ( validBase64RegExp.test( segments[1] ) )
                && Boolean ( validBase64RegExp.test( segments[2] ) );
        },
        isSSOSecretValid : function ( input ) {
            var validRegExp = new RegExp('^[A-Za-z0-9]*$');

            return input.length === 64 && Boolean( validRegExp.test( input ) );
        },
        getErrorText: function (inputFieldId) {
            if (inputFieldId === 'sso-secret') {
                return 'This field can not be empty and must contain 64 characters';
            }

            if (inputFieldId === 'api-key') {
                return 'This field can not be empty and must contain correct JWT string';
            }

            return '';
        },
        showValidationError: function ( fieldJQueryObject ) {
            fieldJQueryObject.closest('div.input-group').addClass('has-error');

            $('#errorMessage').find('span').text(this.getErrorText(fieldJQueryObject.attr('id')));

            this.showNotification('errorMessage');
        },
        showNotification: function ( notificationId ) {
            $( '#' + notificationId ).slideDown();

            setTimeout(function() {
                $( '#' + notificationId ).slideUp();
            }, 3000);
        },
        disableSsoIfDemoOn: function ( demoModeSelector ) {
            if ( $( demoModeSelector )[0].checked ) {
                $( '#sso-support' )[0].checked = false;
            }
        },
        disableDemoIfSsoOn: function (ssoSupportSelector) {
            if ( $( ssoSupportSelector )[0].checked ) {
                $( '#demo-mode' )[0].checked = false;
                $( '#api-key' ).prop('disabled', false);
                $( '#sso-secret' ).prop('disabled', false);
            }
        },
        sendToServer: function () {
            if ( this.isDataChanged() && this.isValid() ) {

                var saveOnServerDeferred = $.Deferred();

                $( '#submitSettings' ).addClass( 'disabled' );

                $.post(
                    '',
                    {
                        action   : 'save-settings',
                        dataType : 'json',
                        data     : this.gatheredData()
                    }
                )
                    .done( function ( serverResponse ) {
                        var response = JSON.parse( serverResponse );

                        if ( response.status === 'success' ) {
                            saveOnServerDeferred.resolve( response.data );
                        } else {
                            saveOnServerDeferred.reject();
                        }

                        $( '#submitSettings' ).removeClass( 'disabled' );
                    } );

                $.when( saveOnServerDeferred ).then(
                    function ( savedSettings ) {
                        settingsFromServer = savedSettings;
                        settingForm.showNotification( 'successMessage' );
                    },
                    function () {
                        settingForm.showNotification( 'failMessage' );
                    }
                );
            }
        }
    };

    (function () {
        $( '#settingForm' ).find( ':input.setting-data' ).each( function () {

            $( this ).val(settingsFromServer[this.name]);

            if ( this.type === 'checkbox' ) {
                $( this ).prop( 'checked', Boolean( Number( settingsFromServer[this.name] ) ) );
            }

            if ( $( this ).hasClass( 'is-dropdown' )) {
                $( '#' + this.name )
                    .text(nameToOutputTextMapper.getOutputText( this.name, settingsFromServer[this.name] ) );
            }
        });

        toggleDisabledInputs.all();
    }) ();

    $( '#settingForm' ).submit( function( event ) {
        event.preventDefault();

        settingForm.sendToServer();
    });

    $( '#submitSettings' ).click( function ( event ) {
        event.preventDefault();

        $( '#settingForm' ).submit();
    } );

    $( '#demo-mode' ).change( function () {
        toggleDisabledInputs.ssoSecret();
        settingForm.disableSsoIfDemoOn( this );
    } );

    $( '#sso-support' ).change( function () {
        toggleDisabledInputs.ssoSupport();
        settingForm.disableDemoIfSsoOn( this );
    } );

    $( '#annoto-advanced-settings-switch' ).change( function () {
        toggleDisabledInputs.toggleAdvancedSettingsContainer( this.checked );
    } );

	$( '#annoto-features-settings-switch' ).change( function () {
        toggleDisabledInputs.toggleFeaturesSettingsContainer( this.checked );
    } );														  
    $( '.dropdown-menu a' ).click( function () {
        var buttonId = $( this ).closest( 'ul' ).data( 'btnId' );
        $( '#' + buttonId ).text( this.innerText );
        $( 'input.setting-data[name=' + buttonId + ']').val( this.name );
        if (buttonId === 'player-type') {
            toggleDisabledInputs.togglePlayerSettings();
        }
    } );

    $('#credentialBlock').click( function () {
        $( this ).find( 'div.input-group' ).removeClass( 'has-error' );
    } );
});
