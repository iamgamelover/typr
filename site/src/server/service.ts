export class Service {
  protected posts:any;
  protected postsInProfile:any;
  protected post:any;
  protected position:number;
  protected positionInProfile:number;
  protected pageNo:number = 1;
  protected pageNoInProfile:number = 1;

  protected isLoggedIn:string;
  protected activeAddress:string;

  constructor() {
    this.post = [];
    this.postsInProfile = [];
  }

  public addPositionToCache(position:number) {
    this.position = position;
  }

  public getPositionFromCache() {
    return this.position;
  }

  public addPositionInProfileToCache(position:number) {
    this.positionInProfile = position;
  }

  public getPositionInProfileFromCache() {
    return this.positionInProfile;
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
  
  public addPostsInProfileToCache(id: string, posts:any) {
    this.postsInProfile[id] = posts;
  }

  public getPostsInProfileFromCache(id:string) {
    return this.postsInProfile[id];
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
  
  public setPageNo(pageNo:number) {
    this.pageNo = pageNo;
  }

  public getPageNo() {
    return this.pageNo;
  }
  
  public setPageNoInProfile(pageNo:number) {
    this.pageNoInProfile = pageNo;
  }

  public getPageNoInProfile() {
    return this.pageNoInProfile;
  }
}