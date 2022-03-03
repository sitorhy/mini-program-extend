import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../../../store/index";
import {mapState, mapMutations, mapActions, mapGetters} from "../../../libs/mp-extend/store";

ComponentEx({
    store,
    computed: {
        role() {
            return store.state.account.role;
        },
        name() {
            return store.state.account.name;
        },
        isAdmin() {
            return store.getters['account/isAdmin'];
        },
        ...mapState('account', {
            avatar: (state) => {
                return state.myPage.avatar;
            }
        }),
        ...mapGetters('account', ['profile']),
        ...mapGetters('account/posts', {
            address: 'popular'
        })
    },
    methods: {
        login() {
            store.dispatch('account/login', {
                role: 'admin',
                name: 'test'
            });
        },
        ...mapMutations('account', ['showAvatar']),
        setAvatar() {
            this.showAvatar("http://tiebapic.baidu.com/forum/w%3D580/sign=c6b5b7cbae014a90813e46b599763971/bdf413dda3cc7cd955b23ca02e01213fb90e9183.jpg");
        },
        ...mapActions('account/posts', [
            'setAddress'
        ]),
        showAddress() {
            this.setAddress('東京都世田谷区北沢3丁目23番14号');
        }
    },
    mounted() {
        console.log(this.$store);
    }
})
