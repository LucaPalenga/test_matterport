

// Get vertex by ID from the graph
function getVertexById(graph, id) {
    return graph.vertices.find(v => v.id === id);
}

async function createGraph(sdk) {
    console.log("Creating graph")
    const graph = sdk.Graph.createDirectedGraph()
    const modelData = await sdk.Model.getData()
    for (let i = 0; i < modelData.sweeps.length; i++) {
        var sweep = modelData.sweeps[i]
        // console.log('Adding sweep: ' + sweep.sid)
        graph.addVertex({ id: sweep.sid, data: sweep })
    }
    graph.setEdge(
        {
            src: graph.vertex("gaqergp0bmzw5sebb8hzf9cid"),
            dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            weight: 1,
        },
        {
            src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            dst: graph.vertex("gaqergp0bmzw5sebb8hzf9cid"),
            weight: 1,
        },
        {
            src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            weight: 1,
        },
        {
            src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            weight: 1,
        },
        // To First Room
        {
            src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            dst: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            weight: 1,
        },
        {
            src: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            weight: 1,
        },
        {
            src: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            dst: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            weight: 1,
        },
        {
            src: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            dst: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            weight: 1,
        },
        {
            src: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            dst: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            weight: 1,
        },
        {
            src: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            dst: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            weight: 1,
        },
        {
            src: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            dst: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            weight: 1,
        },
        {
            src: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            dst: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            weight: 1,
        },
        {
            src: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            dst: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            weight: 1,
        },
        {
            src: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            dst: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            weight: 1,
        },
        {
            src: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            dst: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            weight: 1,
        },
        {
            src: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            dst: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            weight: 1,
        },
        {
            src: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            dst: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            weight: 1,
        },
        {
            src: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            dst: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            weight: 1,
        },
        {
            src: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            dst: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            weight: 1,
        },
        {
            src: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            dst: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            weight: 1,
        },
        {
            src: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            dst: graph.vertex("6rcqhhm01788w21shgq5xbifc"),
            weight: 1,
        },
        {
            src: graph.vertex("6rcqhhm01788w21shgq5xbifc"),
            dst: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            weight: 1,
        },
        // To Second Room
        {
            src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            dst: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            weight: 1,
        },
        {
            src: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            weight: 1,
        },
        {
            src: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            dst: graph.vertex("br8bi09wrtaiudwx3uhmqia5c"),
            weight: 1,
        },
        {
            src: graph.vertex("br8bi09wrtaiudwx3uhmqia5c"),
            dst: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            weight: 1,
        },
        {
            src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            dst: graph.vertex("ah16yng1ddssb8hxqas1kc2hd"),
            weight: 1,
        },
        {
            src: graph.vertex("ah16yng1ddssb8hxqas1kc2hd"),
            dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            weight: 1,
        },
    )
    return graph
}

/**
 * Draws a path using the Matterport SDK by creating a camera sensor
 * and subscribing to its readings.
 * This function iterates over a given path, creating a sensor source
 * for each vertex and adding it to the sensor.
 * @param {Object} sdk - The Matterport SDK instance.
 * @param {Array} path - An array of vertices representing the path to draw,
 * where each vertex contains an id and data with x, y, z coordinates.
 */
async function drawPath(sdk, path) {
    const sensor = await sdk.Sensor.createSensor(sdk.Sensor.SensorType.CAMERA)
    sensor.showDebug(true)
    sensor.readings.subscribe({
        onUpdated(source, reading) {
            if (reading.inRange) {
                console.log(source.userData.id, "is currently in range")
                /*
                if (reading.inView) {
                  console.log("... and currently visible on screen")
                }
                */
            }
        },
    })
    for (let i = 0; i < path.length; i++) {
        var position = {
            x: path[i].data.position.x,
            y: path[i].data.position.y - 0.5,
            z: path[i].data.position.z,
        }

        const source = await sdk.Sensor.createSource(
            sdk.Sensor.SourceType.SPHERE,
            {
                origin: position,
                radius: 0.1,
                userData: {
                    id: path[i].id,
                },
            },
        )
        sensor.addSource(source)
    }
}

export { createGraph, getVertexById, drawPath }
