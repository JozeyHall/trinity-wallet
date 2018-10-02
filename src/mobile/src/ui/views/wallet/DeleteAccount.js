import isEqual from 'lodash/isEqual';
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import PropTypes from 'prop-types';
import { setSetting } from 'shared-modules/actions/wallet';
import { generateAlert } from 'shared-modules/actions/alerts';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { getSelectedAccountName, getSelectedAccountType } from 'shared-modules/selectors/accounts';
import { shouldPreventAction } from 'shared-modules/selectors/global';
import { deleteAccount } from 'shared-modules/actions/accounts';
import { toggleModalActivity } from 'shared-modules/actions/ui';
import Fonts from 'ui/theme/fonts';
import { hash } from 'libs/keychain';
import SeedStore from 'libs/SeedStore';
import { width, height } from 'libs/dimensions';
import CustomTextInput from 'ui/components/CustomTextInput';
import GENERAL from 'ui/theme/general';
import { Icon } from 'ui/theme/icons';
import { leaveNavigationBreadcrumb } from 'libs/bugsnag';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topContainer: {
        flex: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        flex: 1,
        width,
        paddingHorizontal: width / 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        flex: 2.5,
        justifyContent: 'space-around',
        paddingHorizontal: width / 15,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    titleTextLeft: {
        fontFamily: 'SourceSansPro-Regular',
        fontSize: GENERAL.fontSize3,
        backgroundColor: 'transparent',
        marginLeft: width / 20,
    },
    titleTextRight: {
        fontFamily: 'SourceSansPro-Regular',
        fontSize: GENERAL.fontSize3,
        backgroundColor: 'transparent',
        marginRight: width / 20,
    },
    infoText: {
        fontFamily: Fonts.secondary,
        fontSize: GENERAL.fontSize3,
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
    warningText: {
        fontFamily: Fonts.secondary,
        fontSize: GENERAL.fontSize3,
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
});

/** Delete Account component */
class DeleteAccount extends Component {
    static propTypes = {
        /** @ignore */
        setSetting: PropTypes.func.isRequired,
        /** @ignore */
        password: PropTypes.object.isRequired,
        /** @ignore */
        deleteAccount: PropTypes.func.isRequired,
        /** @ignore */
        t: PropTypes.func.isRequired,
        /** Currently selected account name */
        selectedAccountName: PropTypes.string.isRequired,
        /** Currently selected account type */
        selectedAccountType: PropTypes.string.isRequired,
        /** @ignore */
        theme: PropTypes.object.isRequired,
        /** @ignore */
        isAutoPromoting: PropTypes.bool.isRequired,
        /** Determines whether to allow account deletion  */
        shouldPreventAction: PropTypes.bool.isRequired,
        /** @ignore */
        generateAlert: PropTypes.func.isRequired,
        /** @ignore */
        toggleModalActivity: PropTypes.func.isRequired,
    };

    constructor() {
        super();

        this.state = {
            pressedContinue: false,
            password: '',
        };
    }

    componentDidMount() {
        leaveNavigationBreadcrumb('DeleteAccount');
    }

    /**
     * Navigates to account management setting screen
     *
     * @method onBackPress
     */
    onBackPress() {
        if (!this.state.pressedContinue) {
            this.props.setSetting('accountManagement');
        } else {
            this.setState({ pressedContinue: false });
        }
    }

    /**
     * Displays a confirmation modal for account deletion if user entered password is correct/valid
     * Otherwise generates an alert
     *
     * @method onContinuePress
     */
    async onContinuePress() {
        const { password, t } = this.props;
        if (!this.state.pressedContinue) {
            return this.setState({ pressedContinue: true });
        }
        const pwdHash = await hash(this.state.password);

        if (isEqual(password, pwdHash)) {
            return this.showModal();
        }
        return this.props.generateAlert(
            'error',
            t('global:unrecognisedPassword'),
            t('global:unrecognisedPasswordExplanation'),
        );
    }

    /**
     * Deletes account
     *
     * @method onYesPress
     */
    onYesPress() {
        const { t, isAutoPromoting } = this.props;
        if (isAutoPromoting || this.props.shouldPreventAction) {
            return this.props.generateAlert('error', t('global:pleaseWait'), t('global:pleaseWaitExplanation'));
        }
        this.hideModal();
        this.delete();
    }

    /**
     * Hides account deletion confirmation modal
     *
     * @method onNoPress
     */
    onNoPress() {
        this.hideModal();
    }

    /**
     * Deletes account information from keychain and store
     *
     * @method delete
     */
    async delete() {
        const { password, selectedAccountName, selectedAccountType } = this.props;
        const seedStore = new SeedStore[selectedAccountType](password, selectedAccountName);
        await seedStore.removeAccount();
        this.props.deleteAccount(selectedAccountName);
    }

    showModal = () => {
        const { t, theme, selectedAccountName } = this.props;
        this.props.toggleModalActivity('deleteAccount', {
            t,
            theme,
            selectedAccountName,
            onNoPress: () => this.onNoPress(),
            onYesPress: () => this.onYesPress(),
        });
    };

    hideModal = () => {
        this.props.toggleModalActivity();
    };

    render() {
        const { t, theme, selectedAccountName } = this.props;

        const primaryColor = theme.primary.color;
        const textColor = { color: theme.body.color };
        const bodyColor = theme.body.color;

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={styles.topContainer}>
                        <View style={{ flex: 0.5 }} />
                        {!this.state.pressedContinue && (
                            <View style={styles.textContainer}>
                                {/*FIXME: Investigate why Trans component doesn't work here*/}
                                {/*<Trans i18nKey="deleteAccount:areYouSure" accountName={selectedAccountName}>*/}
                                <View style={{ flex: 0.3 }} />
                                <Text style={[styles.infoText, textColor]}>Are you sure you want to delete</Text>
                                <View style={{ flex: 0.25 }} />
                                <Text style={[styles.infoText, textColor]}>{selectedAccountName}?</Text>
                                {/*</Trans>*/}
                                {/*eslint-enable react/jsx-boolean-value*/}
                                <View style={{ flex: 0.4 }} />
                                <Text style={[styles.infoText, textColor]}>{t('yourSeedWillBeRemoved')}</Text>
                                <View style={{ flex: 0.25 }} />
                                <Text style={[styles.warningText, { color: primaryColor }]}>{t('thisAction')}</Text>
                            </View>
                        )}
                        {this.state.pressedContinue && (
                            <View style={styles.textContainer}>
                                <Text style={[styles.infoText, textColor]}>{t('enterPassword')}</Text>
                                <CustomTextInput
                                    label={t('global:password')}
                                    onChangeText={(password) => this.setState({ password })}
                                    containerStyle={{ width: GENERAL.contentWidth }}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    enablesReturnKeyAutomatically
                                    returnKeyType="done"
                                    onSubmitEditing={this.handleLogin}
                                    theme={theme}
                                    secureTextEntry
                                    value={this.state.password}
                                />
                            </View>
                        )}
                        <View style={{ flex: 1.1 }} />
                    </View>
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            onPress={() => this.onBackPress()}
                            hitSlop={{ top: height / 55, bottom: height / 55, left: width / 55, right: width / 55 }}
                        >
                            <View style={styles.itemLeft}>
                                <Icon name="chevronLeft" size={width / 28} color={bodyColor} />
                                <Text style={[styles.titleTextLeft, textColor]}>{t('global:back')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.onContinuePress()}
                            hitSlop={{ top: height / 55, bottom: height / 55, left: width / 55, right: width / 55 }}
                        >
                            <View style={styles.itemRight}>
                                <Text style={[styles.titleTextRight, textColor]}>{t('global:continue')}</Text>
                                <Icon name="tick" size={width / 28} color={bodyColor} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const mapStateToProps = (state) => ({
    password: state.wallet.password,
    theme: state.settings.theme,
    isAutoPromoting: state.polling.isAutoPromoting,
    selectedAccountName: getSelectedAccountName(state),
    selectedAccountType: getSelectedAccountType(state),
    shouldPreventAction: shouldPreventAction(state),
});

const mapDispatchToProps = {
    setSetting,
    generateAlert,
    deleteAccount,
    toggleModalActivity,
};

export default translate(['deleteAccount', 'global'])(connect(mapStateToProps, mapDispatchToProps)(DeleteAccount));
