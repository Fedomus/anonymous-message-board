const chaiHttp = require('chai-http');
const chai = require('chai');
const server = require('../server');
const assert = chai.assert;
const ThreadsDAO = require("../DAOs/ThreadsDAO");
const threads = new ThreadsDAO();

chai.use(chaiHttp);

after(function(){
    threads.deleteBoard("test")
})

suite('Functional Tests', function() {

    test('Creating a new thread: POST request to /api/threads/{board}', function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 1',
            delete_password: 'test123'
        })
        .end(function(err, res){
            assert.equal(res.status, 200)
            assert.equal(res.body.acknowledged, true)
        });
        done()
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done){
        chai
        .request(server)
        .get("/api/threads/test")
        .end(function(err, res){
            let data = res.body;
            assert.equal(res.statusCode, 200);
            assert.isArray(data, "response should be an array");
            assert.property(data[0], "text");
            data.forEach(element => {
                assert(element.replies.length <= 3)
            });
        });
        done()
    });

    test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}", function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 2',
            delete_password: 'test123'
        })
        .end(function(err, res){
            chai
            .request(server)
            .delete("/api/threads/test")
            .send({
                thread_id: res.body.insertedId,
                delete_password: 'incorrect'
            })
            .end(function(err, res){
                assert.equal(res.text, "incorrect password")
            });
        });
        done()
    });

    test("Deleting a thread with the correct password: DELETE request to /api/threads/{board}", function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 3',
            delete_password: 'test123'
        })
        .end(function(err, res){
            chai.request(server)
            .delete("/api/threads/test")
            .send({
                thread_id: res.body.insertedId,
                delete_password: 'test123'
            })
            .end(function(err, res){
                assert.equal(res.status, 200)
                assert.equal(res.text, "success")
            });
        })
        done()
    });

    test("Reporting a thread: PUT request to /api/threads/{board}", function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 4',
            delete_password: 'test123'
        })
        .end(function(err, res){
            chai.request(server)
            .put("/api/threads/test")
            .send({
                thread_id: res.body.insertedId
            })
            .end(function(err, res){
                assert.equal(res.statusCode, 200)
                assert.equal(res.text, 'reported')
            });
        })
        done();
    });
    

    test("Creating a new reply: POST request to /api/replies/{board}", function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 5',
            delete_password: 'test123'
        })
        .end(function(err, res){
            let data = res.body;
            chai
            .request(server)
            .post('/api/replies/test')
            .send({
                thread_id: data.insertedId,
                text: 'testing reply 1',
                delete_password: 'test123'
            })
            .end(function(err, res){
                assert.equal(res.status, 200)
                assert.property(res.body.createdDocument, '_id')
            })
        })
        done()
    })

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 6',
            delete_password: 'test123'
        })
        .end(function(err, res){

            let data = res.body

            chai
            .request(server)
            .post("/api/replies/test")
            .send({
                thread_id: data.insertedId,
                text: 'testing reply 2',
                delete_password: 'test123'
            })
            .end()

            chai
            .request(server)
            .get("/api/replies/test?thread_id="+data.insertedId)
            .end(function(err, res){
                assert.equal(res.status, 200);
                assert.isArray(res.body.replies)
                assert.property(res.body.replies[0], 'text')
            });
        })
        done()
    })

    test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}", function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 7',
            delete_password: 'test123'
        })
        .end(function(err, res){
            let threadId = res.body.insertedId;
            chai
            .request(server)
            .post('/api/replies/test')
            .send({
                thread_id: threadId,
                text: 'testing reply 3',
                delete_password: 'test123'
            })
            .end(function(err, res){
                chai.request(server)
                .delete("/api/replies/test")
                .send({
                    thread_id: threadId,
                    reply_id: res.body.createdDocument._id,
                    delete_password: 'incorrect'
                })
                .end(function(err, res){
                    assert.equal(res.text, 'incorrect password')
                })
            })
        })
        done()
    })

    test("Deleting a reply with the correct password: DELETE request to /api/replies/{board}", function(done){
    chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 8',
            delete_password: 'test123'
        })
        .end(function(err, res){
            let threadId = res.body.insertedId;
            chai
            .request(server)
            .post('/api/replies/test')
            .send({
                thread_id: threadId,
                text: 'testing reply 4',
                delete_password: 'test123'
            })
            .end(function(err, res){
                let replyId = res.body.createdDocument._id;
                chai.request(server)
                .delete("/api/replies/test")
                .send({
                    thread_id: threadId,
                    reply_id: replyId,
                    delete_password: 'test123'
                })
                .end(function(err, res){
                    assert.equal(res.status, 200)
                    assert.equal(res.text, 'success')
                })
            })
        })
        done()
    })

    test("Reporting a reply: PUT request to /api/replies/{board}", function(done){
        chai
        .request(server)
        .post('/api/threads/test')
        .send({
            text: 'testing thread 9',
            delete_password: 'test123'
        })
        .end(function(err, res){
            let threadId = res.body.insertedId;
            chai
            .request(server)
            .post('/api/replies/test')
            .send({
                thread_id: threadId,
                text: 'testing reply 5',
                delete_password: 'test123'
            })
            .end(function(err, res){
                let replyId = res.body.createdDocument._id;
                chai.request(server)
                .put("/api/replies/test")
                .send({
                    thread_id: threadId,
                    reply_id: replyId
                })
                .end(function(err, res){
                    assert.equal(res.status, 200)
                    assert.equal(res.text, 'reported')
                })
            })
        })
        done()
    })


});

