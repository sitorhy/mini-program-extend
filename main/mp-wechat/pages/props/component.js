Component({
    properties: {
        test: {
            type: Number
        }
    },
    data: {},
    methods: {},
    ready() {
        console.log(this);
        console.log(this.data);
        console.log(this.properties)
        console.log(this.dataset)
    }
});
