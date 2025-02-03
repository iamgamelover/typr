export class Service {
  protected profiles:any;
  protected posts:any;
  protected post:any;
  protected postsInProfile:any;
  protected position:number;
  protected positionInProfile:number;
  
  protected stories_all:any;
  protected stories_project:any;
  protected stories_top:any;
  protected story:any;

  protected addrLogIn:string;
  protected activeAddress:string;
  protected defaultProcess:string;
  protected balanceOfAOT:number;
  protected balanceOfTRUNK:number;
  protected balanceOfWAR:number;
  protected balanceOf0rbit:number;
  protected balanceOfUSDA:number;
  
  protected storyTab:number = 0;

  constructor() {
    this.profiles = [];
    this.post = [];
    this.postsInProfile = [];
    this.story = [];
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
  
  public setIsLoggedIn(address:string) {
    this.addrLogIn = address;
  }

  public isLoggedIn() {
    return this.addrLogIn;
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
  
  public setBalanceOfAOT(bal:number) {
    this.balanceOfAOT = bal;
  }

  public getBalanceOfAOT() {
    return this.balanceOfAOT;
  }
  
  public setBalanceOfTRUNK(bal:number) {
    this.balanceOfTRUNK = bal;
  }

  public getBalanceOfTRUNK() {
    return this.balanceOfTRUNK;
  }
  
  public setBalanceOfWAR(bal:number) {
    this.balanceOfWAR = bal;
  }

  public getBalanceOfWAR() {
    return this.balanceOfWAR;
  }
  
  public setBalanceOf0rbit(bal:number) {
    this.balanceOf0rbit = bal;
  }

  public getBalanceOf0rbit() {
    return this.balanceOf0rbit;
  }
  
  public setBalanceOfUSDA(bal:number) {
    this.balanceOfUSDA = bal;
  }

  public getBalanceOfUSDA() {
    return this.balanceOfUSDA;
  }
  
  public setStoryTab(tab:number) {
    this.storyTab = tab;
  }

  public getStoryTab() {
    return this.storyTab;
  }
  
  public addAllStoriesToCache(stories:any) {
    this.stories_all = stories;
  }
  
  public getAllStoriesFromCache() {
    return this.stories_all;
  }
  
  
  public addProjectStoriesToCache(stories:any) {
    this.stories_project = stories;
  }
  
  public getProjectStoriesFromCache() {
    return this.stories_project;
  }
  
  
  public addTopStoriesToCache(stories:any) {
    this.stories_top = stories;
  }
  
  public getTopStoriesFromCache() {
    return this.stories_top;
  }
  
  public addStoryToCache(story:any) {
    this.story[story.id] = story;
  }

  public getStoryFromCache(id:string) {
    return this.story[id];
  }
}