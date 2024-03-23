import React from 'react';
import './NavBar.css';
import { AppConfig } from '../AppConfig';
import { getMenuIcon } from '../util/util';
import NavBarButton from './NavBarButton';

class NavBar extends React.Component {

  renderButton(menu: any) {
    return (
      <NavBarButton
        key={menu.text}
        // icon={getMenuIcon(menu.icon)}
        text={menu.text}
        to={menu.to}
        beta={menu.beta}
        new={menu.new}
      />
    )
  }

  render() {
    let buttons = [];
    let menu = AppConfig.menu;

    for (let i = 0; i < menu.length; i++) {
      if (menu[i].loggedIn) {
        // if (Server.account.isLoggedIn())
        //   buttons.push(this.renderButton(menu[i]));
      }
      else
        buttons.push(this.renderButton(menu[i]));
    }

    return (
      <nav>
        <div className="navbar-container">{buttons}</div>
      </nav>
    );
  }
}

export default NavBar;