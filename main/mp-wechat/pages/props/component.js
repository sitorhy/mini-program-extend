Component({
    properties: {
        test: {
            type: String,
            observer(newVal, oldVal, changedPath) {
                console.log(`component test prop  ${oldVal} -> ${newVal}`)
            }
        }
    },
    data: {},
    methods: {},
    ready() {

    }
});
