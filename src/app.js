import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import styled from 'styled-components';

const GAME_STATE = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  SHOWDOWN: 'SHOWDOWN',
  FINISHED: 'FINISHED',
};

const ACTIONS = {
  START: 'START',
  DRAW: 'DRAW',
  EARLY_DRAW: 'EARLY_DRAW',
};

const Board = styled.main`
  display: grid;
  grid-template-columns: 50% 50%;
  height: 100vh;
  ${({ blur }) => (blur ? 'filter: blur(10px)' : '')};
`;
const DrawButton = styled.button`
  padding: 25px;
  border: solid 1px #333;
  border-radius: 0;
  background: #805d15;
  font-size: 8vw;
  overflow: hidden;

  ${p => (p.isCountdown ? 'background: #2F4172;' : '')};
  ${p => (p.isShowdown ? 'background: #AA4639;' : '')};
  ${p => (p.hasDrawn ? 'background: #805D15;' : '')};
  ${p => (p.isLoser ? 'background: #805D15;' : '')};
  ${p => (p.hasDrawnEarly ? 'background: #553A00;' : '')};
  ${p => (p.isWinner ? 'background: #7B9F35;' : '')};
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  color: white;
`;

const StartButton = styled.button`
  transition: 100ms;
  font-size: 6vw;
  background-color: #aa4639;
  border-radius: 10px;
  border: none;
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 0.4);
  transform: translate(-2px, -2px);
  padding: 1vw 3vw;
  color: white;

  &:hover {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.4);
    transform: translate(0, 0);
  }
`;

const handlePlayerStateChange = (playerState = {}, action) => {
  switch (action.type) {
    case ACTIONS.START:
      // Reset everything but the playerId
      return { playerId: playerState.playerId };
    case ACTIONS.EARLY_DRAW:
      return {
        ...playerState,
        hasDrawnEarly: true,
        score: 99999999,
        hasDrawn: true,
      };
    case ACTIONS.DRAW:
      if (playerState.hasDrawnEarly) {
        return playerState;
      }

      return {
        ...playerState,
        hasDrawn: true,
        score: action.payload.score,
        isWinner: action.payload.drawOrder === 0,
      };
    default:
      return playerState;
  }
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameState: GAME_STATE.IDLE,
      playerCount: 2,
      playerState: {},
    };

    this.draw = this.draw.bind(this);
    this.earlyDraw = this.earlyDraw.bind(this);
    this.start = this.start.bind(this);
    this.getPlayers = this.getPlayers.bind(this);
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

  getPlayers() {
    return [...new Array(this.state.playerCount)].map(
      (_, playerId) => this.state.playerState[playerId] || { playerId }
    );
  }

  start() {
    const preFaceOffTimer = 1000 + Math.random() * 3000;
    this.setState({
      gameState: GAME_STATE.COUNTDOWN,
      playerState: this.getPlayers().reduce((acc, player) => {
        acc[player.playerId] = handlePlayerStateChange(player, {
          type: ACTIONS.START,
        });
        return acc;
      }, {}),
    });

    setTimeout(() => {
      if (this.state.gameState === GAME_STATE.FINISHED) {
        return;
      }

      this.startedAt = Date.now();
      this.setState({ gameState: GAME_STATE.SHOWDOWN });
    }, preFaceOffTimer);
  }

  draw(playerId) {
    const { playerState, playerCount } = this.state;
    if (playerState[playerId] && playerState[playerId].hasDrawn) {
      return;
    }

    const playersDrawnSoFar = this.getPlayers().filter(
      p => p.hasDrawn && !p.hasDrawnEarly
    );

    const allPlayersHaveDrawn =
      this.getPlayers().filter(p => p.hasDrawn).length >= playerCount - 1;

    this.setState({
      playerState: {
        ...playerState,
        [playerId]: handlePlayerStateChange(playerState[playerId], {
          type: ACTIONS.DRAW,
          payload: {
            score: Date.now() - this.startedAt,
            drawOrder: playersDrawnSoFar.length,
          },
        }),
      },
      ...(allPlayersHaveDrawn ? { gameState: GAME_STATE.FINISHED } : {}),
    });
  }

  earlyDraw(playerId) {
    const { playerState, playerCount } = this.state;

    const allPlayersHaveDrawn =
      this.getPlayers().filter(p => p.hasDrawn).length >= playerCount - 1;

    this.setState({
      playerState: {
        ...playerState,
        [playerId]: handlePlayerStateChange(playerState[playerId], {
          type: ACTIONS.EARLY_DRAW,
        }),
      },
      ...(allPlayersHaveDrawn ? { gameState: GAME_STATE.FINISHED } : {}),
    });
  }

  render() {
    const { gameState, playerCount } = this.state;
    const MIN_PLAYER_COUNT = 2;
    const MAX_PLAYER_COUNT = 8;
    const fireEvent = playerId =>
      ({
        [GAME_STATE.COUNTDOWN]: () => this.earlyDraw(playerId),
        [GAME_STATE.SHOWDOWN]: () => this.draw(playerId),
      }[gameState] || (event => event.preventDefault()));

    return (
      <div>
        <Board
          blur={[GAME_STATE.IDLE, GAME_STATE.FINISHED].indexOf(gameState) >= 0}
        >
          {this.getPlayers().map(
            ({ playerId, score, isWinner, hasDrawn, hasDrawnEarly }) => (
              <DrawButton
                key={playerId} // eslint-disable-line react/no-array-index-key
                disabled={
                  gameState !== GAME_STATE.COUNTDOWN &&
                  gameState !== GAME_STATE.SHOWDOWN
                }
                isCountdown={gameState === GAME_STATE.COUNTDOWN}
                isShowdown={gameState === GAME_STATE.SHOWDOWN}
                hasDrawn={hasDrawn}
                isLoser={hasDrawn && !isWinner}
                isWinner={isWinner}
                hasDrawnEarly={hasDrawnEarly}
                onMouseDown={fireEvent(playerId)}
                onTouchStart={fireEvent(playerId)}
              >
                {gameState === GAME_STATE.SHOWDOWN ? 'draw!!!' : 'wait...'}
                <br />
                {gameState === GAME_STATE.FINISHED && !hasDrawnEarly
                  ? `${score / 1000}s`
                  : ''}
              </DrawButton>
            )
          )}
        </Board>

        {[GAME_STATE.IDLE, GAME_STATE.FINISHED].indexOf(gameState) >= 0 ? (
          <ControlPanel>
            <div>
              <StartButton onClick={this.start}>START</StartButton>
              <br />
              <br />
              <div>
                Players:
                <button
                  onClick={() =>
                    this.setState({
                      playerCount: Math.max(playerCount - 1, MIN_PLAYER_COUNT),
                    })
                  }
                >
                  &lt;
                </button>
                {playerCount}
                <button
                  onClick={() =>
                    this.setState({
                      playerCount: Math.min(playerCount + 1, MAX_PLAYER_COUNT),
                    })
                  }
                >
                  &gt;
                </button>
              </div>
            </div>
          </ControlPanel>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default hot(module)(App);
