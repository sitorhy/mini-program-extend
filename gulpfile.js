const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const uglify = require("gulp-uglify");

const LIB_HOME = path.join("main", "mp-extend");
const TEST_UNITS_HOME = path.join("main", "test-units");
const TARGETS = [
    path.join("main", "mp-wechat", "libs"),
    path.join("main", "vue", "libs")
];

function copyFile(location) {
    const paths = location.split(path.sep);
    TARGETS.forEach(i => {
        const target = [
            __dirname,
            i,
            paths[paths.length - 3],
            paths[paths.length - 2]
        ].join(path.sep).replace(/[(\\)(\\/)]/g, path.sep).replace(/\\\\/g, path.sep)
        gulp.src(location).pipe(gulp.dest(target));
    });
}

function deleteFile(location) {
    const paths = location.split(path.sep);
    TARGETS.forEach(i => {
        const target = [
            __dirname,
            i,
            paths[paths.length - 3],
            paths[paths.length - 2],
            paths[paths.length - 1]
        ].join(path.sep).replace(/[(\\)(\\/)]/g, path.sep).replace(/\\\\/g, path.sep)
        fs.unlink(target, function () {
            console.log(`${target} unlink.`);
        });
    });
}

gulp.task('deploy', async () => {
    TARGETS.forEach(i => {
        const dist = `${__dirname}${path.sep}${i}`.replace(/\//g, path.sep);
        [LIB_HOME, TEST_UNITS_HOME].forEach(j => {
            const src = `${__dirname}${path.sep}${j}${path.sep}**${path.sep}*`.replace(/\//g, path.sep);
            const paths = j.split(path.sep);
            const dest = `${dist}${path.sep}${paths[paths.length - 1]}`;
            gulp.src(src).pipe(gulp.dest(dest));
        });
    });
});

gulp.task("dev", gulp.series('deploy', async () => {
    const watcher = gulp.watch([LIB_HOME, TEST_UNITS_HOME].map(i => `${__dirname}${path.sep}${i}`));
    watcher.on('change', function (location, stats) {
        copyFile(location);
    });

    watcher.on('add', function (location, stats) {
        copyFile(location);
    });

    watcher.on('unlink', function (location, stats) {
        deleteFile(location);
    });
}));