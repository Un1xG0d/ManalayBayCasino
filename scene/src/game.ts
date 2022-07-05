import { getUserAccount } from "@decentraland/EthereumController"
import { matic } from "@dcl/l2-scene-utils"
import * as ui from "@dcl/ui-scene-utils"

const _scene = new Entity("_scene")
engine.addEntity(_scene)
const transform = new Transform({
  position: new Vector3(0, 0, 0),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
_scene.addComponentOrReplace(transform)

const entity = new Entity("entity")
engine.addEntity(entity)
entity.setParent(_scene)
const gltfShape = new GLTFShape("models/FloorBaseWood_01/FloorBaseWood_01.glb")
gltfShape.withCollisions = true
gltfShape.isPointerBlocker = true
gltfShape.visible = true
entity.addComponentOrReplace(gltfShape)
const transform2 = new Transform({
  position: new Vector3(8, 0, 8),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
entity.addComponentOrReplace(transform2)

let slotMachineDisplay = new Entity()
slotMachineDisplay.addComponent(
  new Transform({
    position: new Vector3(8, 2.5, 8),
    scale: new Vector3(0.5, 0.5, 0.5)
  })
)
let displayText = new TextShape("Spin" + " | " + "Win" + " | " + "Repeat")
displayText.color = Color3.Blue()
slotMachineDisplay.addComponent(displayText)
engine.addEntity(slotMachineDisplay)

const winAudio = new AudioSource(new AudioClip("sounds/coins.mp3"))
slotMachineDisplay.addComponent(winAudio)

let apiUrl = "http://localhost:3000"
let ownerWallet = "0x9b0031aA38431B05DdFBfb6DaFb278aD7b88Ca13"
let totalGames = 0
let totalPayout = 0
let userAddress = ""

executeTask(async () => {
  try {
    userAddress = await getUserAccount()
  } catch (error) {
    log(error.toString())
  }
})

setupScene()

function addNFT() {
  const nftEntity = new Entity()
  const shapeComponent = new NFTShape(
    "ethereum://0x646559aef966a747C37C922d4AFf8F8E6Ca431Ec/17",
    {
      color: Color3.Black(),
      style: PictureFrameStyle.Gold_Edges,
    }
  )
  nftEntity.addComponent(shapeComponent)
  nftEntity.addComponent(
    new Transform({
      position: new Vector3(8, 1, 12)
    })
  )
  engine.addEntity(nftEntity)
  nftEntity.addComponent(
    new OnPointerDown((e) => {
      showStats()
    })
  )
}

function addSlotMachines() {
  const slotMachines = new Entity("slotMachines")
  engine.addEntity(slotMachines)
  slotMachines.setParent(_scene)
  const transform3 = new Transform({
    position: new Vector3(8, 0.02341, 8),
    rotation: Quaternion.Euler(0, 180, 0),
    scale: new Vector3(1, 1, 1)
  })
  slotMachines.addComponentOrReplace(transform3)
  const gltfShape2 = new GLTFShape("models/slot_machines.glb")
  gltfShape2.withCollisions = true
  gltfShape2.isPointerBlocker = true
  gltfShape2.visible = true
  slotMachines.addComponentOrReplace(gltfShape2)
  slotMachines.addComponent(
    new OnPointerDown((e) => {
      pay()
    },
    {
      button: ActionButton.PRIMARY,
      hoverText: "Spin for 1 MANA"
    })
  )
}

function determinePayout(results) {
  let payout = 0
  if (results["reel1"] == "Horseshoe" && results["reel2"] == "Horseshoe" && results["reel3"] != "Star") {
    payout = 2
  } else if (results["reel1"] == "Horseshoe" && results["reel2"] == "Horseshoe" && results["reel3"] == "Star") {
    payout = 4
  } else if (results["reel1"] == "Spade" && results["reel2"] == "Spade" && results["reel3"] == "Spade") {
    payout = 8
  } else if (results["reel1"] == "Diamond" && results["reel2"] == "Diamond" && results["reel3"] == "Diamond") {
    payout = 12
  } else if (results["reel1"] == "Heart" && results["reel2"] == "Heart" && results["reel3"] == "Heart") {
    payout = 16
  } else if (results["reel1"] == "Bell" && results["reel2"] == "Bell" && results["reel3"] == "Bell") {
    payout = 20
  }
  return payout
}

function getRandomInt(min, max) : number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function pay() {
  slotMachineDisplay.getComponent(TextShape).value = "Verifying tx..."
  await matic.sendMana(ownerWallet, 1).then(() => {
    spin()
  })
}

function setupScene() {
  addNFT()
  addSlotMachines()
}

function showStats() {
  let rtp = Math.round(totalPayout / totalGames * 100)
  let statsAnnouncement = ui.displayAnnouncement("Spins: " + totalGames.toString() + " | Paid: " + totalPayout.toString() + " | RTP: " + rtp.toString() + "%", 5, Color4.White(), 15)
}

function spin() {
  let reel1 = ["Bell", "Horseshoe", "Spade", "Horseshoe", "Diamond", "Horseshoe", "Spade", "Horseshoe", "Heart", "Horseshoe"]
  let reel2 = ["Bell", "Horseshoe", "Spade", "Horseshoe", "Diamond", "Horseshoe", "Spade", "Horseshoe", "Heart", "Horseshoe"]
  let reel3 = ["Bell", "Diamond", "Star", "Spade", "Bell", "Diamond", "Heart", "Star", "Spade", "Diamond"]
  let results = { "reel1": reel1[getRandomInt(0,9)], "reel2": reel2[getRandomInt(0,9)], "reel3": reel3[getRandomInt(0,9)] }
  let payout = determinePayout(results)
  let payoutTextColor = Color4.White()
  if (payout > 0) {
    payoutTextColor = Color4.Green()
    winAudio.playOnce()
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Basic c3ZjOk1BTkFsYXlCYXkx"
      },
      body: JSON.stringify({ "winnings": payout, "winner": userAddress })
    })
  }
  let payoutAnnouncement = ui.displayAnnouncement("Winnings: " + payout.toString() + " MANA", 4, payoutTextColor, 30)
  totalGames += 1
  totalPayout += payout
  slotMachineDisplay.getComponent(TextShape).value = results["reel1"] + " | " + results["reel2"] + " | " + results["reel3"]
}
