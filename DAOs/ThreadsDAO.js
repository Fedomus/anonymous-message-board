const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;

module.exports = class ThreadDAO {

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  async readThreads(board){
    try {
      const recentThreads = await this.client.db('messageboard').collection('threads')
        .find({board},{
          reported: 0,
          delete_password: 0,
          replies: 1,
          "replies.reported": 0,
          "replies.delete_password": 0
        })
        .sort({bumped_on: -1})
        .limit(10)
        .toArray()
      if(recentThreads.length){
        recentThreads.forEach(thread => {

          thread.replycount = thread.replies.length

          if(thread.replycount > 3){
            thread.replies = thread.replies.slice(-3);
          }
        });
      }
      return recentThreads
    } catch (e){
      this.errorHandler(e.message)
    }
  }

  async errorHandler(message){
    console.log("Error in database: " + message);
    throw new Error("Error in database: " + message);
  }

  async createThread(data){

    try { 
      const createdResult = await this.client.db('messageboard').collection('threads')
      .insertOne({
        board: data.board,
        text: data.text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password: data.delete_password,
        replies: []
      })
      return createdResult
    } catch(e) {
      this.errorHandler(e.message)
    } 
  }

  async updateThread(data){
    try {
      let id = data.thread_id || data.report_id
      const updateResult = await this.client.db('messageboard').collection('threads').updateOne({
        _id: new ObjectId(id)
      }, {
        $set: {
          reported: true
        }
      });
      return updateResult
    } catch (e){
      this.errorHandler(e.message)
    }
  }

  async deleteThread(data){
    
    try {
      let deletedThread = await this.client.db('messageboard').collection('threads').findOneAndDelete({
        _id: new ObjectId(data.thread_id),
        delete_password: data.delete_password
      });
      return deletedThread;
    } catch (e) {
      this.errorHandler(e.message)
    }
  }

  async readThreadAndReplies(data){
    
    try {
      let thread = await this.client.db('messageboard').collection('threads').findOne({
        _id: new ObjectId(data.thread_id)
      },{
          reported: 0,
          delete_password: 0,
          replies: 1,
          "replies.reported": 0,
          "replies.delete_password": 0
      });
      return thread
    } catch(e) {
      this.errorHandler(e.message)
    }
  }

  async createReply(data){

    try {
      const id = new ObjectId();
      const fechaHoy = new Date();
      const createdReply = await this.client.db('messageboard').collection('threads').updateOne(
        { _id: new ObjectId(data.thread_id) },
        {
          $set: { bumped_on: fechaHoy },
          $push: {
            replies: {
              _id: id,
              text: data.text,
              created_on: fechaHoy,
              delete_password: data.delete_password,
              reported: false
            }
          }
        }
      );
      const threadDocument = await this.client.db('messageboard').collection('threads').findOne({
        _id: new ObjectId(data.thread_id),
      }, {
        replies: 1
      });
      const replies = threadDocument.replies;
   
      for (const repl of replies) {
        const replId = new ObjectId(repl._id)
        let sonIguales = replId.equals(id);
        if(sonIguales){
          createdReply.createdDocument = repl
        }
      }
      return createdReply
    } catch(e) {
      this.errorHandler(e.message)
    }
  }

  async updateReply(data){

    try {
      const updatedReply = await this.client.db('messageboard').collection('threads').updateOne(
        {
          _id: new ObjectId(data.thread_id),
          "replies._id": new ObjectId(data.reply_id)
        },
        { $set: { "replies.$.reported": true } }
      );
      return updatedReply
    } catch(e) {
      this.errorHandler(e.message)
    }
  }

  async deleteReply(data){
    
    try{
      const deletedReply = await this.client.db('messageboard').collection('threads').updateOne(
        {
          _id: new ObjectId(data.thread_id),
          replies: {
            $elemMatch: {
              _id: new ObjectId(data.reply_id),
              delete_password: data.delete_password
            }
          }
        },
        { $set: { "replies.$.text": "[deleted]" } }
      );
      return deletedReply
    } catch (e){
      this.errorHandler(e.message)
    }
  }

  async deleteBoard(board){
    try{
        await this.client.db('messageboard').collection('threads').deleteMany({board});
      } catch (e) {
        this.errorHandler(e.message)
      }
  }
}