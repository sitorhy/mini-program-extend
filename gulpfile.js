const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const uglify = require("gulp-uglify");

const LIB_HOME = path.join("main", "mp-extend");
const TEST_UNITS_HOME = path.join("main", "test-units");


function copyFile(location, targetSubDir) {
    const dir = path.dirname(location);
    const dest = [
        `main/mp-wechat/libs/${targetSubDir}/`.replace(/\\/g, '/'),
        `main/vue/libs/${targetSubDir}/`.replace(/\\/g, '/')
    ];
    const index = dir.indexOf(targetSubDir);
    if (index >= 0) {
        const iDir = index + targetSubDir.length;
        const sub = dir.substring(iDir + 1);
        dest.forEach(i => {
            gulp.src(location, {
                base: dir
            }).pipe(gulp.dest(i + sub));
        });
    }
}

function deleteFile(location, targetSubDir) {
    const dest = [
        `main/mp-wechat/libs/${targetSubDir}/`.replace(/\\/g, '/'),
        `main/vue/libs/${targetSubDir}/`.replace(/\\/g, '/')
    ];
    dest.forEach(i => {
        fs.unlink(i, function () {
            console.log(`unlink "${location}"`);
        });
    });
}

gulp.task("deploy", async () => {
    gulp.src(LIB_HOME + "/**/*.js", {
        base: LIB_HOME
    }).pipe(gulp.dest(`main/mp-wechat/libs/mp-extend/`));
    gulp.src(TEST_UNITS_HOME + "/**/*.js", {
        base: TEST_UNITS_HOME
    }).pipe(gulp.dest(`main/mp-wechat/libs/test-units/`));
});

gulp.task("dev", gulp.series(['deploy'], async () => {
    const libWatcher = gulp.watch(LIB_HOME);
    const testWatcher = gulp.watch(TEST_UNITS_HOME);
    libWatcher.on('change', function (location, stats) {
        copyFile(location, "mp-extend");
    });
    testWatcher.on('change', function (location, stats) {
        copyFile(location, "test-units");
    });

    libWatcher.on('add', function (location, stats) {
        copyFile(location, "mp-extend");
    });
    testWatcher.on('add', function (location, stats) {
        copyFile(location, "test-units");
    });

    libWatcher.on('unlink', function (location, stats) {
        deleteFile(location, "mp-extend");
    });
    testWatcher.on('unlink', function (location, stats) {
        deleteFile(location, "test-units");
    });
}));