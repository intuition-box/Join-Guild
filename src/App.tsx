import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import AtomsGrid from './components/AtomsGrid'
import './App.css'

function App() {
  const { address, chainId } = useAccount()
  const { data: nativeBalance } = useBalance({
    address,
    chainId,
    unit: 'ether',
    query: { enabled: !!address },
  })

  return (
    <>
      <div className="top-right">
        <ConnectButton showBalance={false} />
      </div>
      <main>
        <h1>Intuition guilds</h1>
        <AtomsGrid
          atomIds={[
            '0x1e26f83663a1ecad2e6e064cbd2d1bb630fff9d4a33e17b1742c8e994ca8a592',
            '0x8c486fd3377cef67861f7137bcc89b188c7f1781314e393e22c1fa6fa24e520e',
            '0x1de157191ec5d1e398819f11b3664b1827d80437d5e6d1db61bbf569f90ae980',
          ]}
        />
      </main>
    </>
  )
}

export default App

