
//////////////////////////////////////////////////////////////////////
// Graph utilities
//////////////////////////////////////////////////////////////////////

function createCustomGraph(sdk, modelData) {
    console.log("Creating custom graph");
    const graph = sdk.Graph.createDirectedGraph();

    for (let i = 0; i < modelData.sweeps.length; i++) {
        var sweep = modelData.sweeps[i];
        console.log('Adding sweep: ' + sweep.sid);
        graph.addVertex({ id: sweep.sid, data: sweep });
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
        }
    );
    return graph;
}

// Returns the vertex by ID from the graph
function getVertexById(graph, id) {
    return graph.vertices.find(v => v.id === id);
}


export { createCustomGraph, getVertexById }
