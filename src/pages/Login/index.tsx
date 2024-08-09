import './index.scss';
import { Card, Form, Input, Button, message } from 'antd';
import React from 'react';
import logo from '@/assets/logo.png';
import { useDispatch } from 'react-redux';
import { fetchLogin } from '@/store/modules/user';
import { UnknownAction } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';

export interface ILogin {
  mobile: string,
  code: string
}

const Login: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const onFinish = async (params: ILogin) => {
    await dispatch(fetchLogin(params) as unknown as UnknownAction);
    nav('/board');
    message.success('');
  };
  return (
    <div className="login">
      <Card className="login-container">
        <img className="login-logo" src={logo} alt="" />
        <Form onFinish={onFinish} validateTrigger="onBlur">
          <Form.Item
            name="mobile"
            rules={[
              {
                required: true,
                message: '请输入手机号',
              },
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号格式'
              }
            ]}>
            <Input size="large" placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="code"
            rules={[
              {
                required: true,
                message: '请输入验证码',
              },
            ]}>
            <Input size="large" placeholder="请输入验证码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;