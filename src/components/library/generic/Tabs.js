import React, { Component } from "react";

class Tabs extends Component {

  constructor() {
    super();
    this.state = {
      selected: 0
    }
  }

  componentWillMount() {
    const selectedTab =
      this.props.children &&
      this.props.children.findIndex &&
      this.props.children.findIndex(tab => {
        return tab.props.selected;
      });
    this.setState({
      selected: selectedTab > -1 ? selectedTab : 0
    });
  }  

  setTab = tab => e => {
    var tabs = [].concat(this.props.children);
    this.setState({
      selected: tab
    });
    if (tabs[tab].props.onClick) {
      tabs[tab].props.onClick();
    }
  };


  render() {
    const {children, ...props} = this.props;
    const {selected} = this.state;
    const tabs = [].concat(children);

    return (
      <div {...props}>
        <div className="TabContainer__Tabs">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              name={tab.props.name}
              selected={index === selected}
              onClick={this.setTab(index)}
            />
          ))}
        </div>
        {tabs[selected] && tabs[selected].props.children}
      </div>
    );
  }  

}

class Tab extends Component {
  render() {
    const { name, selected, onClick } = this.props;
    return (
      <div
        className="TabContainer__Tab"
        onClick={onClick}
      >
        {name}
      </div>
    );
  }
}

export {
  Tabs,
  Tab
}