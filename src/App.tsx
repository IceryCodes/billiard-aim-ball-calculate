import { useCallback } from 'react';

import { Button, Col, Modal, Row, Typography } from 'antd';
import { AiFillCopyrightCircle } from 'react-icons/ai';

import './App.css';
import BilliardAimCalculation from './BilliardAimCalculation';

const App = () => {
  const { Title } = Typography;

  const showModal = useCallback(() => {
    Modal.info({
      title: (
        <a title="Icery / 阿瑋" href="https://www.Icery.tw" target="_blank" rel="noreferrer">
          Icery說明
        </a>
      ),
      content: (
        <section>
          <p>A: 撞擊接觸點</p>
          <p>B: 瞄球視角子球邊緣</p>
          <p>C: 瞄球視角母球邊緣</p>
          <p>※ 圖片可以直接複製</p>

          <Row gutter={5} style={{ marginTop: 25 }}>
            <Col>
              <AiFillCopyrightCircle />
            </Col>
            <Col>
              <span>{new Date().getFullYear()} All Rights Reserved.</span>
            </Col>
            <Col>
              <a title={`Icery's email`} href={'mailto:Icery@Icery.tw'} target="_blank" rel="noreferrer">
                Icery@Icery.tw
              </a>
            </Col>
          </Row>
        </section>
      ),
      onOk() {},
    });
  }, []);

  return (
    <section
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <section
        style={{
          marginTop: 20,
          marginBottom: 30,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 15,
        }}
      >
        <Row gutter={10} align="middle">
          <Col>
            <Title className="unselectable title">瞄準角度</Title>
          </Col>
          <Col>
            <Button className="tip-button" type="link" onClick={showModal}>
              說明
            </Button>
          </Col>
        </Row>
        <BilliardAimCalculation />
      </section>
    </section>
  );
};

export default App;
