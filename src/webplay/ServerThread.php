<?php

namespace webplay;

use pocketmine\Thread;

class ServerThread extends Thread {

    private $plugin;
    private $app;
    public $joinQueue;
    public $sendQueue;
    public $readQueue;
    private $cLoader;
    private $loadPaths;

    public function __construct(WebPlayPlugin $plugin, \Threaded $joinQueue, \Threaded $sendQueue, \Threaded $readQueue)
    {
        $this->plugin = $plugin;
        $this->joinQueue = $joinQueue;
        $this->sendQueue = $sendQueue;
        $this->readQueue = $readQueue;
        $this->cLoader = $plugin->getServer()->getLoader();

        $loadPaths = [];
        $this->addDependency($loadPaths, new \ReflectionClass($this->cLoader));
        $this->addDependency($loadPaths, new \ReflectionClass("\\webplay\\WebPlayApplication"));
        $this->addDependency($loadPaths, new \ReflectionClass("\\Wrench\\Server"));
        $this->loadPaths = array_reverse($loadPaths);
    }

    protected function addDependency(array &$loadPaths, \ReflectionClass $dep){
        if($dep->getFileName() !== false){
            $loadPaths[$dep->getName()] = $dep->getFileName();
        }
        if($dep->getParentClass() instanceof \ReflectionClass){
            $this->addDependency($loadPaths, $dep->getParentClass());
        }
        foreach($dep->getInterfaces() as $interface){
            $this->addDependency($loadPaths, $interface);
        }
    }

    public function run() {
        foreach($this->loadPaths as $name => $path){
            if(!class_exists($name, false) and !interface_exists($name, false)){
                require($path);
            }
        }
        $this->cLoader->register();

        $this->app = new WebPlayApplication($this);

        $server = new \Wrench\Server('ws://localhost:8000/', array(
            'check_origin'               => false,
            'allowed_origins'            => array(
                'mysite.localhost'
            ),
// Optional defaults:
//     'check_origin'               => true,
//     'connection_manager_class'   => 'Wrench\ConnectionManager',
//     'connection_manager_options' => array(
//         'timeout_select'           => 0,
//         'timeout_select_microsec'  => 200000,
//         'socket_master_class'      => 'Wrench\Socket\ServerSocket',
//         'socket_master_options'    => array(
//             'backlog'                => 50,
//             'ssl_cert_file'          => null,
//             'ssl_passphrase'         => null,
//             'ssl_allow_self_signed'  => false,
//             'timeout_accept'         => 5,
//             'timeout_socket'         => 5,
//         ),
//         'connection_class'         => 'Wrench\Connection',
//         'connection_options'       => array(
//             'socket_class'           => 'Wrench\Socket\ServerClientSocket',
//             'socket_options'         => array(),
//             'connection_id_secret'   => 'asu5gj656h64Da(0crt8pud%^WAYWW$u76dwb',
//             'connection_id_algo'     => 'sha512'
//         )
//     )
        ));
        //$server->registerApplication('echo', new \Wrench\Application\EchoApplication());
        $server->registerApplication('minecraft', $this->app);
        $server->run();
    }

}