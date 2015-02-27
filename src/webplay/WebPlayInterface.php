<?php

namespace webplay;


use pocketmine\math\Vector3;
use pocketmine\network\protocol\AddPlayerPacket;
use pocketmine\network\protocol\ChatPacket;
use pocketmine\network\protocol\ContainerSetContentPacket;
use pocketmine\network\protocol\ContainerSetSlotPacket;
use pocketmine\network\protocol\DataPacket;
use pocketmine\network\protocol\EntityEventPacket;
use pocketmine\network\protocol\FullChunkDataPacket;
use pocketmine\network\protocol\Info;
use pocketmine\network\protocol\InteractPacket;
use pocketmine\network\protocol\LoginPacket;
use pocketmine\network\protocol\MessagePacket;
use pocketmine\network\protocol\MovePlayerPacket;
use pocketmine\network\protocol\RemovePlayerPacket;
use pocketmine\network\protocol\SetEntityMotionPacket;
use pocketmine\network\protocol\StartGamePacket;
use pocketmine\network\protocol\UnloadChunkPacket;
use pocketmine\network\protocol\UpdateBlockPacket;
use pocketmine\network\protocol\UseItemPacket;
use pocketmine\network\SourceInterface;
use pocketmine\Player;
use pocketmine\utils\Binary;
use pocketmine\utils\TextFormat;

class WebPlayInterface implements SourceInterface {

    private $plugin;

    private $needACK = [];
    private $ackId = 0;

    public function __construct(WebPlayPlugin $plugin) {
        $this->plugin = $plugin;
    }

    public function sendPacket(WebPlayPlayer $player, $str) {
        $this->plugin->thread->sendQueue[] = pack("S", strlen($player->connId)) . $player->connId . $str;
    }

    /**
     * Sends a DataPacket to the interface, returns an unique identifier for the packet if $needACK is true
     *
     * @param Player $player
     * @param DataPacket $packet
     * @param bool $needACK
     * @param bool $immediate
     *
     * @return int
     */
    public function putPacket(Player $player, DataPacket $packet, $needACK = false, $immediate = true)
    {
        if($packet instanceof FullChunkDataPacket) {
            //echo "FullChunkDataPacket\n";
            $str = " ";
            $str[0] = chr(1);
            $str .= $packet->data;
            $this->sendPacket($player, $str);
        } else if($packet instanceof UpdateBlockPacket) {
            $str = " ";
            $str[0] = chr(2);
            $str .= pack("N", $packet->x);
            $str .= pack("N", $packet->z);
            $str .= chr($packet->y);
            $str .= chr($packet->block);
            $str .= chr($packet->meta);
            $this->sendPacket($player, $str);
        } else if($packet instanceof UnloadChunkPacket) {
            $str = " ";
            $str[0] = chr(3);
            $str .= pack("N", $packet->chunkX);
            $str .= pack("N", $packet->chunkZ);
            $this->plugin->thread->sendQueue[] = $str;
        } else if($packet instanceof MovePlayerPacket) {
            if($packet->eid == $player->getId() || $packet->eid == 0) {
                $str = " ";
                $str[0] = chr(4);
                $str .= pack("f", $packet->x);
                $str .= pack("f", $packet->y);
                $str .= pack("f", $packet->z);
                $str .= pack("f", $packet->pitch);
                $str .= pack("f", $packet->yaw);
                $this->sendPacket($player, $str);
            } else {
                $str = " ";
                $str[0] = chr(7);
                $str .= pack("N", $packet->eid);
                $str .= pack("f", $packet->x);
                $str .= pack("f", $packet->y);
                $str .= pack("f", $packet->z);
                $str .= pack("f", $packet->pitch);
                $str .= pack("f", $packet->yaw);
                $str .= pack("f", $packet->bodyYaw);
                $this->sendPacket($player, $str);
            }
        } else if($packet instanceof StartGamePacket) {
            $str = " ";
            $str[0] = chr(4);
            $str .= pack("f", $packet->x);
            $str .= pack("f", $packet->y);
            $str .= pack("f", $packet->z);
            $this->sendPacket($player, $str);
        } else if($packet instanceof MessagePacket) {
            $str = " ";
            $str[0] = chr(5);
            $str .= $packet->message;
            $this->sendPacket($player, $str);
        } else if($packet instanceof AddPlayerPacket) {
            $str = " ";
            $str[0] = chr(6);
            $str .= pack("N", $packet->eid);
            $str .= pack("f", $packet->x);
            $str .= pack("f", $packet->y);
            $str .= pack("f", $packet->z);
            $str .= pack("f", $packet->pitch);
            $str .= pack("f", $packet->yaw);
            $str .= pack("N", strlen($packet->username));
            $str .= $packet->username;
            $this->sendPacket($player, $str);
        } else if($packet instanceof RemovePlayerPacket) {
            $str = " ";
            $str[0] = chr(8);
            $str .= pack("N", $packet->eid);
            $this->sendPacket($player, $str);
        } else if($packet instanceof EntityEventPacket) {
            $str = " ";
            $str[0] = chr(9);
            $str .= pack("N", $packet->eid);
            $str .= chr($packet->event);
            $this->sendPacket($player, $str);
        } else if($packet instanceof ContainerSetContentPacket) {
            $str = " ";
            $str[0] = chr(10);
            $str .= chr($packet->windowid);
            $str .= pack("S", count($packet->slots));
            foreach($packet->slots as $slot){
                $str .= pack("S", $slot->getId());
                $str .= chr($slot->getCount());
                $str .= pack("S", $slot->getDamage());
            }
            if($packet->windowid === 0 and count($packet->hotbar) > 0){
                $str .= pack("S", count($packet->hotbar));
                foreach($packet->hotbar as $slot){
                    $str .= pack("N", $slot);
                }
            }else{
                $str .= pack("S", 0);
            }
            $this->sendPacket($player, $str);
        } else if($packet instanceof ContainerSetSlotPacket) {
            $str = " ";
            $str[0] = chr(11);
            $str .= chr($packet->windowid);
            $str .= pack("S", count($packet->slot));
            $str .= pack("S", $packet->slot->getId());
            $str .= chr($packet->slot->getCount());
            $str .= pack("S", $packet->slot->getDamage());
            $this->sendPacket($player, $str);
        } else if($packet instanceof SetEntityMotionPacket) {
            $str = " ";
            $str[0] = chr(12);
            $str .= pack("S", count($packet->entities));
            foreach($packet->entities as $entry) {
                $str .= pack("N", $entry[0]);
                $str .= pack("f", $entry[1]);
                $str .= pack("f", $entry[2]);
                $str .= pack("f", $entry[3]);
            }
            $this->sendPacket($player, $str);
        }

        if($needACK) {
            $this->needACK[$this->ackId++] = $player;
            return $this->ackId;
        }
    }

    /**
     * Terminates the connection
     *
     * @param Player $player
     * @param string $reason
     *
     */
    public function close(Player $player, $reason = "unknown reason")
    {
        // TODO: Implement close() method.
    }

    /**
     * @param string $name
     */
    public function setName($name)
    {
        // TODO: Implement setName() method.
    }

    private $i = 1;
    private $players = [];

    /**
     * @return bool
     */
    public function process()
    {
        foreach($this->needACK as $id => $player) {
            $player->handleACK($id);
            unset($this->needACK[$id]);
        }

        foreach($this->plugin->thread->joinQueue as $i => $id) {
            //echo "Adding connection: " . $id . " ";
            $p = new WebPlayPlayer($this, $id, "192.168.0.1", 1234);
            $this->players[$id] = $p;
            $this->plugin->getServer()->addPlayer("Test" . $this->i, $p);

            $pk = new LoginPacket;
            $pk->username = "Test" . $this->i;
            $pk->clientId = 1;
            $pk->loginData = "webplay";
            $pk->protocol1 = Info::CURRENT_PROTOCOL;
            $p->handleDataPacket($pk);

            unset($this->plugin->thread->joinQueue[$i]);

            $this->i++;
        }

        foreach($this->plugin->thread->readQueue as $i => $packet) {
            //echo "Adding connection: " . $id . " ";
            $playerIdLen = unpack("S", substr($packet, 0, 2))[1];
            $playerId = substr($packet, 2, $playerIdLen);

            $packet = substr($packet, 2 + $playerIdLen);
            $pId = ord($packet[0]);
            $p = $this->players[$playerId];
            if($pId == 1) {
                // pos, look
                $x = unpack("f", substr($packet, 1, 4))[1];
                $y = unpack("f", substr($packet, 5, 4))[1];
                $z = unpack("f", substr($packet, 9, 4))[1];
                $yaw = unpack("f", substr($packet, 13, 4))[1];
                $pitch = unpack("f", substr($packet, 17, 4))[1];

                $pk = new MovePlayerPacket;
                $pk->x = $x;
                $pk->y = $y;
                $pk->z = $z;
                $pk->yaw = $yaw;
                $pk->pitch = $pitch;
                $pk->bodyYaw = $yaw;
                $p->handleDataPacket($pk);
            } else if($pId == 2) {
                // pos
                $x = unpack("f", substr($packet, 1, 4))[1];
                $y = unpack("f", substr($packet, 5, 4))[1];
                $z = unpack("f", substr($packet, 9, 4))[1];
                //echo $y."\n";

                $pk = new MovePlayerPacket;
                $pk->x = $x;
                $pk->y = $y;
                $pk->z = $z;
                $pk->yaw = $p->yaw;
                $pk->pitch = $p->pitch;
                $pk->bodyYaw = $p->yaw;
                $p->handleDataPacket($pk);
            } else if($pId == 3) {
                // look
                $yaw = unpack("f", substr($packet, 1, 4))[1];
                $pitch = unpack("f", substr($packet, 5, 4))[1];

                $pk = new MovePlayerPacket;
                $pk->x = $p->x;
                $pk->y = $p->y;
                $pk->z = $p->z;
                $pk->yaw = $yaw;
                $pk->pitch = $pitch;
                $pk->bodyYaw = $yaw;
                $p->handleDataPacket($pk);
            } else if($pId == 4) {
                // command
                $msg = substr($packet, 1);

                $pk = new MessagePacket;
                $pk->source = "";
                $pk->message = $msg;
                $p->handleDataPacket($pk);
            } else if($pId == 5) {
                // attack
                $eid = unpack("N", substr($packet, 1, 4))[1];

                $pk = new InteractPacket;
                $pk->eid = 0;
                $pk->target = $eid;
                $pk->action = 0;
                $p->handleDataPacket($pk);
            } else if($pId == 6) {
                // use item
                $x = Binary::readInt(substr($packet, 1, 4));
                $y = Binary::readInt(substr($packet, 5, 4));
                $z = Binary::readInt(substr($packet, 9, 4));
                $face = ord($packet[13]);
                $pk = new UseItemPacket;
                $pk->eid = 0;
                $pk->x = $x;
                $pk->y = $y;
                $pk->z = $z;
                $pk->face = $face;
                $pk->fx = 0;
                $pk->fy = 0;
                $pk->fz = 0;
                $pk->posX = 0;
                $pk->posY = 0;
                $pk->posZ = 0;
                $item = $p->getInventory()->getItemInHand();
                $pk->item = $item->getId();
                $pk->meta = $item->getDamage();
                $p->handleDataPacket($pk);
            } else if($pId == 7) {
                // set held
                $id = ord($packet[1]);
                $p->getInventory()->setHeldItemIndex($id);
            } else if($pId == 8) {
                // set held
                $hotbarId = ord($packet[1]);
                $invSlotId = ord($packet[2]);
                $p->getInventory()->setHotbarSlotIndex($hotbarId, $invSlotId);
            } else if($pId == 99) {
                // disconnect
                echo "*closing session\n";
                $p->close(TextFormat::YELLOW . $p->getName() . " has left the game", "client disconnect");
            }

            unset($this->plugin->thread->readQueue[$i]);
        }
    }

    public function shutdown()
    {
        // TODO: Implement shutdown() method.
    }

    public function emergencyShutdown()
    {
        // TODO: Implement emergencyShutdown() method.
    }
}