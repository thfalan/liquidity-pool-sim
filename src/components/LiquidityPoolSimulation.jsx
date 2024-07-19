import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LiquidityPoolSimulation = () => {
  const [currentPool, setCurrentPool] = useState({ PST: 500, HKD: 1000 });
  const [newPool, setNewPool] = useState({ PST: 500, HKD: 1000 });
  const [lpTokens, setLpTokens] = useState(707.11); // sqrt(500 * 1000)
  const [trade, setTrade] = useState({ type: 'HKD to PST', amount: '' });
  const [addLiquidity, setAddLiquidity] = useState({ PST: '', HKD: '' });
  const [tradeEstimate, setTradeEstimate] = useState(null);
  const [graphData, setGraphData] = useState([]);

  const FEE_RATE = 0.003; // 0.3% fee

  useEffect(() => {
    simulateChanges();
    setGraphData(generateTradeGraph());
  }, [trade, addLiquidity, currentPool]);

  const simulateChanges = () => {
    let simulatedPool = { ...currentPool };
  
    // Simulate Trade
    if (trade.amount) {
      const amount = Number(trade.amount);
      if (!isNaN(amount) && amount > 0) {
        const fee = amount * FEE_RATE;
        const totalAmountWithFee = amount + fee;
        if (trade.type === 'HKD to PST') {
          const newPST = (simulatedPool.PST * simulatedPool.HKD) / (simulatedPool.HKD + amount);
          const pstReceived = simulatedPool.PST - newPST;
          simulatedPool = {
            PST: newPST,
            HKD: simulatedPool.HKD + totalAmountWithFee
          };
          setTradeEstimate(pstReceived);
        } else {
          const newHKD = (simulatedPool.PST * simulatedPool.HKD) / (simulatedPool.PST + amount);
          const hkdReceived = simulatedPool.HKD - newHKD;
          simulatedPool = {
            PST: simulatedPool.PST + totalAmountWithFee,
            HKD: newHKD
          };
          setTradeEstimate(hkdReceived);
        }
      } else {
        setTradeEstimate(null);
      }
    } else {
      setTradeEstimate(null);
    }

    // Simulate Add Liquidity
    if (addLiquidity.PST && addLiquidity.HKD) {
      const pstAmount = Number(addLiquidity.PST);
      const hkdAmount = Number(addLiquidity.HKD);
      if (!isNaN(pstAmount) && !isNaN(hkdAmount) && pstAmount > 0 && hkdAmount > 0) {
        const currentRatio = simulatedPool.HKD / simulatedPool.PST;
        if (Math.abs(hkdAmount / pstAmount - currentRatio) < 0.01) {
          simulatedPool = {
            PST: simulatedPool.PST + pstAmount,
            HKD: simulatedPool.HKD + hkdAmount
          };
        }
      }
    }

    setNewPool(simulatedPool);
  };

  const generateTradeGraph = () => {
    const data = [];
    for (let i = 0; i <= 100; i++) {
      const input = (i / 100) * 1000; // Scale to 0-1000 range
      const fee = input * FEE_RATE;
      const totalInputWithFee = input + fee;
      let output;
      if (trade.type === 'HKD to PST') {
        output = currentPool.PST - (currentPool.PST * currentPool.HKD) / (currentPool.HKD + input);
      } else {
        output = currentPool.HKD - (currentPool.PST * currentPool.HKD) / (currentPool.PST + input);
      }
      data.push({
        input: input,
        output: output
      });
    }
    return data;
  };

  const handlePoolChange = (token, value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) return;

    const newCurrentPool = { ...currentPool, [token]: numValue };
    setCurrentPool(newCurrentPool);
  };

  const executeChanges = () => {
    setCurrentPool(newPool);
    setTrade({ ...trade, amount: '' });
    setAddLiquidity({ PST: '', HKD: '' });
    setTradeEstimate(null);
  };

  const PoolState = ({ pool, title, textColor }) => (
    <div className={`space-y-2 ${textColor}`}>
      <h3 className="text-lg font-bold">{title}</h3>
      <p>PST: {pool.PST.toFixed(2)}</p>
      <p>HKD: {pool.HKD.toFixed(2)}</p>
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <p className="text-2xl font-bold text-center">
          Current Price: <span className="text-yellow-400">${(pool.HKD / pool.PST).toFixed(2)} HKD</span> per PST
        </p>
      </div>
      <div className="mt-4 h-40 bg-gray-700 rounded-lg overflow-hidden">
        <div 
          className="h-full bg-blue-500" 
          style={{ width: `${(pool.PST / (pool.PST + pool.HKD)) * 100}%`, float: 'left' }}
        >
          <p className="text-center pt-2 font-bold">PST</p>
        </div>
        <div 
          className="h-full bg-green-500" 
          style={{ width: `${(pool.HKD / (pool.PST + pool.HKD)) * 100}%`, float: 'left' }}
        >
          <p className="text-center pt-2 font-bold">HKD</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">Liquidity Pool Simulation</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-gray-800 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-400">Current Pool State</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <Label htmlFor="pstAmount" className="text-lg font-semibold text-blue-400">PST:</Label>
                <Input
                  id="pstAmount"
                  type="number"
                  value={currentPool.PST}
                  onChange={(e) => handlePoolChange('PST', e.target.value)}
                  className="text-lg font-medium bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2 flex-1 ml-4">
                <Label htmlFor="hkdAmount" className="text-lg font-semibold text-green-400">HKD:</Label>
                <Input
                  id="hkdAmount"
                  type="number"
                  value={currentPool.HKD}
                  onChange={(e) => handlePoolChange('HKD', e.target.value)}
                  className="text-lg font-medium bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <p className="text-gray-300">LP Tokens: <span className="font-semibold">{lpTokens.toFixed(2)}</span></p>
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-center">
                Current Price: <span className="text-yellow-400">${(currentPool.HKD / currentPool.PST).toFixed(2)} HKD</span> per PST
              </p>
            </div>
            <div className="mt-4 h-40 bg-gray-700 rounded-lg overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${(currentPool.PST / (currentPool.PST + currentPool.HKD)) * 100}%`, float: 'left' }}
              >
                <p className="text-center pt-2 font-bold">PST</p>
              </div>
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${(currentPool.HKD / (currentPool.PST + currentPool.HKD)) * 100}%`, float: 'left' }}
              >
                <p className="text-center pt-2 font-bold">HKD</p>
              </div>
            </div>
          </CardContent>
        </Card>
  
        <Card className="bg-gray-800 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-400">Simulated New State</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <PoolState pool={newPool} title="New Pool State" textColor="text-purple-300" />
            <Button onClick={executeChanges} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Execute Changes
            </Button>
          </CardContent>
        </Card>
      </div>
  
      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-gray-800 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-400">Trade</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="tradeType" className="text-lg font-semibold text-gray-300">Trade Type</Label>
              <select
                id="tradeType"
                value={trade.type}
                onChange={(e) => setTrade({ ...trade, type: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-gray-700 border-gray-600 text-white text-lg"
              >
                <option value="HKD to PST">HKD to PST</option>
                <option value="PST to HKD">PST to HKD</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tradeAmount" className="text-lg font-semibold text-gray-300">Amount</Label>
              <Input
                id="tradeAmount"
                type="number"
                value={trade.amount}
                onChange={(e) => setTrade({ ...trade, amount: e.target.value })}
                className="text-lg bg-gray-700 border-gray-600 text-white"
              />
            </div>
            {tradeEstimate !== null && (
              <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-lg font-semibold text-yellow-400">
                  Estimated {trade.type === 'HKD to PST' ? 'PST' : 'HKD'} to receive: {tradeEstimate.toFixed(4)}
                </p>
                <p className="text-sm text-gray-400">
                  Fee: {(Number(trade.amount) * FEE_RATE).toFixed(4)} {trade.type.split(' ')[0]}
                </p>
                <p className="text-sm text-gray-400">
                  Total amount (including fee): {(Number(trade.amount) * (1 + FEE_RATE)).toFixed(4)} {trade.type.split(' ')[0]}
                </p>
              </div>
            )}
            
            <div className="mt-4 h-60 bg-gray-700 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
    <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#555" />
      <XAxis 
        dataKey="input"
        name={trade.type.split(' ')[0]} 
        unit={trade.type.split(' ')[0]} 
        stroke="#888"
        domain={[0, 1000]}
        type="number"
        tickCount={6}
      />
      <YAxis 
        dataKey="output"
        name={trade.type === 'HKD to PST' ? 'PST' : 'HKD'} 
        unit={trade.type === 'HKD to PST' ? 'PST' : 'HKD'} 
        stroke="#888"
        domain={[0, 1000]}
        type="number"
        tickCount={6}
      />
      <Tooltip 
        contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} 
        formatter={(value, name, props) => [value.toFixed(2), name]}
      />
      <Line 
        type="monotone" 
        dataKey="output" 
        stroke="#8884d8" 
        dot={false} 
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
  
        <Card className="bg-gray-800 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-green-400">Add Liquidity</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="addPST" className="text-lg font-semibold text-gray-300">PST Amount</Label>
              <Input
                id="addPST"
                type="number"
                value={addLiquidity.PST}
                onChange={(e) => setAddLiquidity({ ...addLiquidity, PST: e.target.value })}
                className="text-lg bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="addHKD" className="text-lg font-semibold text-gray-300">HKD Amount</Label>
              <Input
                id="addHKD"
                type="number"
                value={addLiquidity.HKD}
                onChange={(e) => setAddLiquidity({ ...addLiquidity, HKD: e.target.value })}
                className="text-lg bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiquidityPoolSimulation;