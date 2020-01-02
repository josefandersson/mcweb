window.zlib = {
    gunzip: (compressed, cb) => {
        let uncompressed = pako.inflate(compressed)
        cb(null, uncompressed)
    }
}