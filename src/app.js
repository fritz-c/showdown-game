import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import styled from 'styled-components';

const GAME_STATE = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  SHOWDOWN: 'SHOWDOWN',
  FINISHED: 'FINISHED',
};

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
      [GAME_STATE.IDLE]: 'lightgray',
      [GAME_STATE.COUNTDOWN]: 'lightblue',
      [GAME_STATE.SHOWDOWN]: 'red',
    }[gameState] || 'lightgray')};
`;

const ControlPanel = styled.div`
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  text-align: center;
  background-color: white;
`;

const StartButton = styled.button`
  pointer-events: auto;
`;

const TimeDisplay = styled.div``;

// const handlePlayerStateChange = (playerState, action) => {
//   switch (action.type) {
//     case 'DRAW':
//       return { ...playerState, hasDrawn: true, score: action.payload };
//     default:
//       return playerState
//   }
// };

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameState: GAME_STATE.IDLE,
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
    this.setState({ gameState: GAME_STATE.COUNTDOWN, playerState: {} });
    setTimeout(() => {
      this.startedAt = Date.now();
      this.setState({ gameState: GAME_STATE.SHOWDOWN });

      const redrawTimer = () =>
        requestAnimationFrame(() => {
          this.setState({
            timer: Date.now() - this.startedAt,
          });

          if (this.state.gameState === GAME_STATE.SHOWDOWN) {
            redrawTimer();
          }
        });
      redrawTimer();
    }, preFaceOffTimer);
  }

  draw(playerId) {
    const { playerState, playerCount } = this.state;
    if (playerState[playerId] && playerState[playerId].hasDrawn) {
      return;
    }

    const playersDrawnSoFar = Object.keys(playerState)
      .map(i => playerState[i])
      .filter(({ hasDrawn }) => hasDrawn);

    const allPlayersHaveDrawn = playersDrawnSoFar.length >= playerCount - 1;

    this.setState({
      playerState: {
        ...playerState,
        [playerId]: {
          ...playerState[playerId],
          hasDrawn: true,
          score: Date.now() - this.startedAt,
        },
      },
      ...(allPlayersHaveDrawn ? { gameState: GAME_STATE.FINISHED } : {}),
    });
  }

  earlyDraw(playerId) {}

  render() {
    const { timer, gameState, playerState, playerCount } = this.state;
    const fireEvent = playerId =>
      ({
        [GAME_STATE.COUNTDOWN]: () => this.earlyDraw(playerId),
        [GAME_STATE.SHOWDOWN]: () => this.draw(playerId),
      }[gameState] || (event => event.preventDefault()));

    return (
      <div>
        <Board>
          {[...new Array(playerCount)]
            .map((_, playerId) => playerState[playerId] || { playerId })
            .map(({ playerId, score }) => (
              <DrawButton
                key={playerId} // eslint-disable-line react/no-array-index-key
                disabled={gameState !== GAME_STATE.SHOWDOWN}
                gameState={gameState}
                onMouseDown={fireEvent(playerId)}
                onTouchStart={fireEvent(playerId)}
              >
                {gameState === GAME_STATE.SHOWDOWN ? 'draw!!!' : 'wait...'}
                <br />
                {(gameState === GAME_STATE.FINISHED && score) || ''}
              </DrawButton>
            ))}
        </Board>

        <ControlPanel>
          {gameState === GAME_STATE.SHOWDOWN ? (
            <TimeDisplay>{timer}</TimeDisplay>
          ) : (
            <StartButton
              onClick={this.start}
              disabled={
                gameState !== GAME_STATE.IDLE &&
                gameState !== GAME_STATE.FINISHED
              }
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
