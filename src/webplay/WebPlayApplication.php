<?php

namespace webplay;


use Wrench\Application\Application;
use Wrench\Application\Connection;
use Wrench\Application\Payload;
use Wrench\Protocol\Protocol;

class WebPlayApplication extends Application {

    private $thread;
    public $clients;

    public function __construct(ServerThread $thread) {
        $this->thread = $thread;
    }

    /**
     * @param Connection $client
     */
    public function onConnect($client)
    {
        $id = $client->getId();
        $this->clients[$id] = $client;
        $this->thread->synchronized(function($thread, $id){
            $thread->joinQueue[] = $id;
        }, $this->thread, $id);
    }

    public function onDisconnect($client) {
        $id = $client->getId();
        unset($this->clients[$id]);
        $this->thread->synchronized(function($thread, $id){
            $str = " ";
            $str[0] = chr(99);
            $thread->readQueue[] = pack("S", strlen($id)) . $id . $str;
        }, $this->thread, $id);
    }

    /**
     * Handle data received from a client
     *
     * @param Payload $payload A payload object, that supports __toString()
     * @param Connection $connection
     */
    public function onData($payload, $connection)
    {
        $id = $connection->getId();
        if($id != null) {
            $str = pack("S", strlen($id)) . $id . $payload->__toString();

            $this->thread->synchronized(function($thread, $connection, $id, $str){
                $pId = ord($str[0]);
                if($pId != 0) {
                    $thread->readQueue[] = $str;
                }

                foreach($thread->sendQueue as $eid => $ent) {
                    $playerIdLen = unpack("S", substr($ent, 0, 2))[1];
                    $playerId = substr($ent, 2, $playerIdLen);
                    if($playerId == $id) {
                        unset($thread->sendQueue[$eid]);
                        $connection->send(substr($ent, 2 + $playerIdLen), Protocol::TYPE_BINARY);
                    }
                }
            }, $this->thread, $connection, $id, $str);
        }
    }

    public function onBinaryData($payload, $connection)
    {
        $this->onData($payload, $connection);
    }
}