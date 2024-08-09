import { request } from "@/utils";
import React, { useEffect } from "react";
import './index.scss';
import { Outlet } from "react-router-dom";
import SideBarHeader from "../SideBar/SideBarHeader";
import SideBarBody from "../SideBar/SideBarBody";
import SideBarFooter from "../SideBar/SideBarFooter";

const HomeContainer: React.FC = () => {
  useEffect(() => {
  },[]);

  return (
    <div className="home">
      <div className="home-side-bar-container">
        <SideBarHeader />
        <SideBarBody />
        <SideBarFooter />
      </div>
      <div className="home-chat-container">
        <Outlet />
      </div>
    </div>
  )
};

export default HomeContainer;