export class Service {
  protected profiles:any;
  protected posts:any;
  protected postsInProfile:any;
  protected post:any;
  protected position:number;
  protected positionInProfile:number;

  protected isLoggedIn:string;
  protected activeAddress:string;
  protected defaultProcess:string;
  protected balanceOfAOT:string;

  constructor() {
    this.profiles = [];
    this.post = [];
    this.postsInProfile = [];
  }

  public getProfile(id:string) {
    return this.profiles[id];
  }

  public addProfileToCache(profile:any) {
    this.profiles[profile.address] = profile;
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
  
  public setDefaultProcess(process:string) {
    this.defaultProcess = process;
  }

  public getDefaultProcess() {
    return this.defaultProcess;
  }
  
  public setBalanceOfAOT(process:string) {
    this.balanceOfAOT = process;
  }

  public getBalanceOfAOT() {
    return this.balanceOfAOT;
  }
  
}