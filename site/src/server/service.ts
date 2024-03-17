export class Service {
  protected posts:any;
  protected post:any;

  constructor() {
    this.post = [];
  }

  public addPostsToCache(posts:any) {
    this.posts = posts;
  }
  
  public getPostsFromCache() {
    return this.posts;
  }
  
  public addPostToCache(post:any) {
    this.post[post.id] = post;
  }

  public getPostFromCache(id:string) {
    return this.post[id];
  }
}