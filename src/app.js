import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import styled from 'styled-components';

const Board = styled.main`
  display: flex;
  height: 100vh;
`;
const DrawButton = styled.button`
  flex: 1 1 auto;
  padding: 25px;
  border: solid black 2px;
  background-color: ${({ gameState }) =>
    ({
      idle: 'lightgray',
      countdown: 'lightblue',
      showdown: 'red',
    }[gameState] || 'lightgray')};
`;

const ControlPanel = styled.div`
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  text-align: center;
`;

const StartButton = styled.button`
  pointer-events: auto;
`;

const TimeDisplay = styled.div``;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameState: 'idle',
      timer: 0,
      playerCount: 2,
      playerState: {},
    };

    this.draw = this.draw.bind(this);
    this.earlyDraw = this.earlyDraw.bind(this);
    this.start = this.start.bind(this);
  }

  componentDidMount() {
    // Prevent two-finger pinch from zooming out to other tabs in iOS Safari
    window.addEventListener('touchmove', e => {
      e.preventDefault();
    });

    // window.addEventListener('keydown', e => {
    //   let handled =
    //   switch (e.keyCode) {
    //   case 'CASE_1':
    //     // code...
    //   default:
    //   }
    // })
  }

  start() {
    const preFaceOffTimer = 1000 + Math.random() * 3000;
    this.setState({ gameState: 'countdown', playerState: {} });
    setTimeout(() => {
      this.startedAt = Date.now();
      this.setState({ gameState: 'showdown' });

      const redrawTimer = () =>
        requestAnimationFrame(() => {
          this.setState({
            timer: Date.now() - this.startedAt,
          });

          if (this.state.gameState === 'showdown') {
            redrawTimer();
          }
        });
      redrawTimer();
    }, preFaceOffTimer);
  }

  draw(playerId) {
    const { playerState, playerCount } = this.state;
    if (playerState[playerId] && playerState[playerId].score) {
      return;
    }

    const allPlayersHaveDrawn =
      Object.keys(playerState).filter(i => playerState[i].score).length >=
      playerCount - 1;

    this.setState({
      playerState: {
        ...playerState,
        [playerId]: {
          ...playerState[playerId],
          score: Date.now() - this.startedAt,
        },
      },
      ...(allPlayersHaveDrawn ? { gameState: 'finished' } : {}),
    });
  }

  earlyDraw(playerId) {}

  render() {
    const { timer, gameState, playerState, playerCount } = this.state;
    const fireEvent = playerId =>
      ({
        countdown: () => this.earlyDraw(playerId),
        showdown: () => this.draw(playerId),
      }[gameState] || (event => event.preventDefault()));

    return (
      <div>
        <Board>
          {[...new Array(playerCount)].map((_, playerId) => (
            <DrawButton
              key={playerId} // eslint-disable-line react/no-array-index-key
              disabled={gameState !== 'showdown'}
              gameState={gameState}
              onMouseDown={fireEvent(playerId)}
              onTouchStart={fireEvent(playerId)}
            >
              {gameState === 'showdown' ? 'draw!!!' : 'wait...'}
              <br />
              {(gameState === 'finished' &&
                playerState[playerId] &&
                playerState[playerId].score) ||
                ''}
            </DrawButton>
          ))}
        </Board>

        <ControlPanel>
          {gameState === 'showdown' ? (
            <TimeDisplay>{timer}</TimeDisplay>
          ) : (
            <StartButton
              onClick={this.start}
              disabled={gameState !== 'idle' && gameState !== 'finished'}
            >
              START
            </StartButton>
          )}
        </ControlPanel>
      </div>
    );
  }
}

export default hot(module)(App);
