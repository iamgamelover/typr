export class AppConfig {
  public static siteName = 'Up Up';
  public static secretPassword = 'ploy';

  public static menu = [
    {
      text: 'Home',
      icon: 'home',
      to: '/',
      loggedIn: false
    },
    {
      text: 'TokenEco',
      icon: 'token',
      to: '/token',
      loggedIn: false
    },
    {
      text: 'Notifications',
      icon: 'notifications',
      to: '/notifications',
      loggedIn: false
    },
    {
      text: 'Bookmark',
      icon: 'bookmark',
      to: '/bookmark',
      loggedIn: false
    },
    {
      text: 'Chatroom',
      icon: 'chatroom',
      to: '/chatroom',
      loggedIn: false
    },
    {
      text: 'Profile',
      icon: 'profile',
      to: '/profile',
      loggedIn: false
    },
  ];
}