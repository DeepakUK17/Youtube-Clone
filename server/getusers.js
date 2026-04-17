import mongoose from "mongoose";

mongoose.connect("mongodb+srv://yourtube_user:Deepak%40sai1@cluster0.e9isubi.mongodb.net/youtube-clone?retryWrites=true&w=majority&appName=Cluster0")
.then(async () => {
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log(users.map(u => ({ id: u._id, name: u.name, email: u.email, channelname: u.channelname })));
    process.exit(0);
});
