Page({
    onLoad() {
        this.setData({
            rand: Math.random()
        })
    },
    onSaveExitState() {
        return {
            data: {
                myField: "myFieldValue"
            }
        }
    }
});