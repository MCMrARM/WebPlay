<?php

namespace webplay;

use pocketmine\event\Listener;
use pocketmine\plugin\PluginBase;

class WebPlayPlugin extends PluginBase implements Listener {

    public $interface;
    public $thread;
    private $joinQueue;
    private $sendQueue;
    private $readQueue;

    public function onEnable(){
        $this->joinQueue = new \Threaded();
        $this->sendQueue = new \Threaded();
        $this->readQueue = new \Threaded();
        $this->thread = new ServerThread($this, $this->joinQueue, $this->sendQueue, $this->readQueue);
        $this->thread->start();

        $this->interface = new WebPlayInterface($this);
        $this->getServer()->addInterface($this->interface);

        $this->getLogger()->info("Starting a web server on port 8080...");
        $this->getServer()->getPluginManager()->registerEvents($this, $this);
    }

}