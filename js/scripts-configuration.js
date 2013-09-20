jQuery(document).ready(function($){ 'use strict';
	
	// mostra o nascondi configurazione statica IP in base al valore della select
	if( $('#dhcp').length ){
		if ($('#dhcp').val() == 'false') {
			$('#network-manual-config').show();
		}                        
		$('#dhcp').change(function(){          
			if ($(this).val() == 'true') {
				$('#network-manual-config').hide();
				console.log('TRUE');
			}
			else {
				$('#network-manual-config').show();
				console.log('FALSE');
			}                                                            
		});
	}
	
	// mostra opzioni avanzate
	if( $('.show-advanced-config').length ){
		$('.show-advanced-config').click(function(e){
			e.preventDefault();
			if ($(this).hasClass('active'))
			{
				$('.advanced-config').hide();
				$(this).removeClass('active');
				$(this).find('i').removeClass('icon-minus-sign').addClass('icon-plus-sign');
				$(this).find('span').html('Show advanced options');
			} else {
				$('.advanced-config').show();
				$(this).addClass('active');
				$(this).find('i').removeClass('icon-plus-sign').addClass('icon-minus-sign');
				$(this).find('span').html('Hide advanced options');
			}
		});	
	}
	
	// conferma modifiche manuali
	if( $('.manual-edit-confirm').length ){
		$(this).find('.btn-primary').click(function(){
			$('#mpdconf_editor').show().removeClass('hide');
			$(this).hide();
		});
	}
	
});



// FUNZIONI
// ----------------------------------------------------------------------------------------------------

