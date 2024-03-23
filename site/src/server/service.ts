export class Service {
  protected posts:any;
  protected post:any;
  protected position:number;

  protected isLoggedIn:string;
  protected activeAddress:string;

  constructor() {
    this.post = [];
  }

  public addPositionToCache(position:number) {
    this.position = position;
  }

  public getPositionFromCache() {
    return this.position;
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
  
  public setIsLoggedIn(isLoggedIn:string) {
    this.isLoggedIn = isLoggedIn;
  }

  public getIsLoggedIn() {
    return this.isLoggedIn;
  }
  
  public setActiveAddress(activeAddress:string) {
    this.activeAddress = activeAddress;
  }

  public getActiveAddress() {
    return this.activeAddress;
  }
}