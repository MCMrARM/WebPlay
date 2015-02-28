<?php

namespace webplay;

use pocketmine\Player;

class WebPlayPlayer extends Player {

    public $connId;

    public function __construct(WebPlayInterface $interface, $connId, $ip, $port){
        $this->connId = $connId;
        parent::__construct($interface, 1, $ip, $port);
        $this->setRemoveFormat(false);
    }

    public function showTitle($title, $subtitle, $time, $fade = true, $titleR = 1, $titleG = 1.0, $titleB = 1.0, $titleA = 1.0, $subtitleR = 1.0, $subtitleG = 1.0, $subtitleB = 1.0, $subtitleA = 1.0) {
        $str = " ";
        $str[0] = chr(13);
        if($title != null) {
            $str .= chr(strlen($title));
            $str .= $title;
        } else {
            $str .= chr(255);
        }
        if($subtitle != null) {
            $str .= chr(strlen($subtitle));
            $str .= $subtitle;
        } else {
            $str .= chr(255);
        }
        $str .= pack("S", $time);
        $str .= chr($fade == true ? 1 : 0);
        $str .= pack("f", $titleR);
        $str .= pack("f", $titleG);
        $str .= pack("f", $titleB);
        $str .= pack("f", $titleA);
        $str .= pack("f", $subtitleR);
        $str .= pack("f", $subtitleG);
        $str .= pack("f", $subtitleB);
        $str .= pack("f", $subtitleA);
        $this->interface->sendPacket($this, $str);
    }

}