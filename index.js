import React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Animated,
    Image,
    TouchableHighlight,
    Platform
} from 'react-native';
import styles from './style';
import emojiData from 'emoji-datasource';
import _ from 'lodash';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import TabBar from './tab';
import TabBarDot from './tabDot';
import stringify from './stringify';
import parse from './parse';
import splitter from './grapheme-splitter';
import PropTypes from 'prop-types';
import ViewPropTypes from './viewproptypes';

require('string.fromcodepoint');

const categories = ['People', 'Nature', 'Foods', 'Activity', 'Places', 'Objects', 'Symbols', 'Flags'];
const filters = ['white_frowning_face'];
const blockIconNum = 23;
let choiceness = ['grinning', 'grin', 'joy', 'sweat_smile', 'laughing', 'wink', 'blush', 'yum', 'heart_eyes', 'kissing_heart',
    'kissing_smiling_eyes', 'stuck_out_tongue_winking_eye', 'sunglasses', 'smirk', 'unamused', 'thinking_face',
    'flushed', 'rage', 'triumph', 'sob', 'mask', 'sleeping', 'zzz', 'hankey', 'ghost', '+1', '-1', 'facepunch', 'v',
    'ok_hank', 'muscle', 'pray', 'point_up', 'lips', 'womans_hat', 'purse', 'crown', 'dog', 'panda_face', 'pig',
    'earth_asia', 'cherry_blossom', 'sunny', 'thunder_cloud_and_rain', 'zap', 'snowflake', 'birthday', 'lollipop',
    'beers', 'popcorn', 'soccer', 'airplane', 'iphone', 'tada', 'heart', 'broken_heart', 'flag_us', 'flag_cn'];

const choicenessAndroid = ['grinning', 'grin', 'joy', 'sweat_smile', 'laughing', 'wink', 'blush', 'yum', 'heart_eyes', 'kissing_heart',
    'kissing_smiling_eyes', 'stuck_out_tongue_winking_eye', 'sunglasses', 'smirk', 'unamused',
    'flushed', 'rage', 'triumph', 'sob', 'mask', 'sleeping', 'zzz', 'hankey', 'ghost', '+1', '-1', 'facepunch', 'v',
    'ok_hank', 'muscle', 'pray', 'point_up', 'lips', 'womans_hat', 'purse', 'crown', 'dog', 'panda_face', 'pig',
    'earth_asia', 'cherry_blossom', 'sunny', 'thunder_cloud_and_rain', 'zap', 'snowflake', 'birthday', 'lollipop',
    'beers', 'soccer', 'airplane', 'iphone', 'tada', 'heart', 'broken_heart', 'flag_us', 'flag_cn'];

class Emoticons extends React.Component {
    constructor(props) {
        super(props);
        this._classify = this._classify.bind(this);
        this._onEmoticonPress = this._onEmoticonPress.bind(this);
        this.state = {
            data: [],
            groupIndex: 0,
            position: 0,//new Animated.Value(this.props.show ? 0 : -300),
            currentMainTab: 0,
            currentDotTab: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
        // this._classify();
        Platform.OS === 'android' ? choiceness = choicenessAndroid : '';
    }

    static defaultProps = {
        show: false,
        concise: true,
        showHistoryBar: true,
        showPlusBar: true,
        asyncRender: false
    };

    componentDidMount() {
    }

    componentWillMount() {
        this._classify();
    }

    componentDidUpdate() {
        // Animated.timing(
        //     this.state.position,
        //     {
        //         duration: 100,
        //         toValue: this.props.show ? 0 : -300
        //     }
        // ).start();
    }

    _charFromCode(utf16) {
        return String.fromCodePoint(...utf16.split('-').map(u => '0x' + u));
    }

    _classify() {
        let filteredData = emojiData.filter(e => !_.includes(filters, e.short_name));
        let sortedData = _.orderBy(filteredData, 'sort_order');
        let groupedData = _.groupBy(sortedData, 'category');

        if (this.props.concise) {
            filteredData = emojiData.filter(e => _.includes(choiceness, e.short_name));
            const temp = [];
            _.mapKeys(filteredData, (value) => {
                temp.push({
                    code: this._charFromCode(value.unified),
                    name: value.short_name
                });
            });
            _.each(choiceness, (value) => {
                const one = temp.filter(e => _.includes([value], e.name));
                if (one[0])
                    this.state.data.push(one[0]);
            });
        } else {
            this.state.data = _.mapValues(groupedData, group => group.map((value) => {
                return {
                    code: this._charFromCode(value.unified),
                    name: value.short_name
                }
            }));
        }

    }

    _onChangeTabMain(data) {
        this.setState({ currentMainTab: data.i });
    }

    _onChangeTabDot(data) {
        this.state.currentDotTab[this.state.currentMainTab] = data.i;
        this.setState({ currentDotTab: this.state.currentDotTab });
    }

    _onPlusPress() {
    }

    _onEmoticonPress(val) {
        if (this.props.onEmoticonPress) {
            this.props.onEmoticonPress(val);
        }
    }

    _onBackspacePress() {
        if (this.props.onBackspacePress)
            this.props.onBackspacePress();
    }

    _onCloseWV() {
    }

    render() {
        const the = this;
        let groupIndex = this.props.showPlusBar ? 1 : 0;
        let group = emoji => {
            if (this.props.asyncRender && this.state.currentMainTab !== groupIndex) {
                groupIndex++;
                return [];
            }
            groupIndex++;

            let groupView = [];
            if (!emoji)
                return groupView;
            const blocks = Math.ceil(emoji.length / blockIconNum);
            for (let i = 0; i < blocks; i++) {
                let ge = _.slice(emoji, i * blockIconNum, (i + 1) * blockIconNum);
                groupView.push(
                    <View style={styles.groupView} key={emoji[0]['name'] + 'block' + i}
                        tabLabel={emoji[0]['name'] + 'block' + i}>
                        {
                            ge.map((value, key) => {
                                if ((this.props.asyncRender && this.state.currentDotTab[this.state.currentMainTab] == i)
                                    || !this.props.asyncRender)
                                    return (
                                        <TouchableHighlight
                                            underlayColor={'#f1f1f1'}
                                            onPress={() => this._onEmoticonPress(value)}
                                            style={styles.emojiTouch}
                                            key={Math.random() + value.name}
                                        >
                                            <Text
                                                style={styles.emoji}
                                            >
                                                {value.code}
                                            </Text>
                                        </TouchableHighlight>

                                    );

                            })
                        }
                        {
                            (this.props.asyncRender && this.state.currentDotTab[this.state.currentMainTab] == i)
                                || !this.props.asyncRender ? (<TouchableOpacity
                                    onPress={() => this._onBackspacePress()}
                                    style={[styles.emojiTouch, styles.delete]}
                                >
                                    <Image
                                        resizeMode={'contain'}
                                        style={styles.backspace}
                                        source={require('./backspace.png')} />
                                </TouchableOpacity>) : null
                        }


                    </View>
                );
            }
            return groupView;
        };


        let groupsView = [];

        if (this.props.concise) {
            const groupView = group(the.state.data);

            groupsView.push(
                <View
                    tabLabel={the.state.data[0]['code']}
                    style={styles.cateView}
                    key={the.state.data[0]['name']}
                >
                    <ScrollableTabView
                        tabBarPosition='bottom'
                        renderTabBar={() => <TabBarDot {...the.props} />}
                        onChangeTab={this._onChangeTabDot.bind(this)}
                        initialPage={0}
                        tabBarActiveTextColor="#fc7d30"
                        style={styles.scrollGroupTable}
                        tabBarUnderlineStyle={{ backgroundColor: '#fc7d30', height: 2 }}
                    >
                        {
                            groupView
                        }
                    </ScrollableTabView>

                </View>
            );
        } else {
            _.each(categories, (value, key) => {
                const groupView = group(the.state.data[value]);
                if (groupView.length >= 0) {
                    groupsView.push(
                        <View
                            tabLabel={the.state.data[value][0]['code']}
                            style={styles.cateView}
                            key={value}
                        >
                            <ScrollableTabView
                                tabBarPosition='bottom'
                                renderTabBar={() => <TabBarDot {...the.props} />}
                                onChangeTab={this._onChangeTabDot.bind(this)}
                                initialPage={0}
                                tabBarActiveTextColor="#fc7d30"
                                style={styles.scrollGroupTable}
                                tabBarUnderlineStyle={{ backgroundColor: '#fc7d30', height: 2 }}
                            >
                                {
                                    groupView
                                }
                            </ScrollableTabView>

                        </View>
                    );
                }
            });
        }

        let style = [styles.container, { bottom: this.state.position }]
        if (Platform.OS === 'android') {
            style = [styles.container, { bottom: this.state.position, height: this.props.height }]
        }

        return (
            <Animated.View style={style} onLayout={this.props.onLayout}>
                <ScrollableTabView
                    tabBarPosition='overlayBottom'
                    renderTabBar={() => <TabBar {...this.props} onPlusPress={this._onPlusPress.bind(this)} />}
                    initialPage={this.state.groupIndex}
                    onChangeTab={this._onChangeTabMain.bind(this)}
                    tabBarActiveTextColor="#fc7d30"
                    style={styles.scrollTable}
                    tabBarUnderlineStyle={{ backgroundColor: '#fc7d30', height: 2 }}
                >
                    {groupsView}
                </ScrollableTabView>
            </Animated.View>
        );
    }
}

Emoticons.propTypes = {
    onEmoticonPress: PropTypes.func.isRequired,
    onBackspacePress: PropTypes.func,
    style: ViewPropTypes.style,
    show: PropTypes.bool,
    concise: PropTypes.bool,
    showHistoryBar: PropTypes.bool,
    showPlusBar: PropTypes.bool,
    asyncRender: PropTypes.bool
};

export default Emoticons;
export {
    stringify as stringify,
    parse as parse,
    splitter as splitter
}
